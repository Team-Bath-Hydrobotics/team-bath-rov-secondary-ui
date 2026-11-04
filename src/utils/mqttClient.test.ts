import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SessionConfig } from '../types';

// mqttClient.ts calls mqtt.connect() at import time, so the module must be
// mocked before it is imported to avoid opening a real broker connection.
const { connectMock, publishMock } = vi.hoisted(() => {
  const publishMock = vi.fn();
  const connectMock = vi.fn(() => ({ publish: publishMock }));
  return { connectMock, publishMock };
});

vi.mock('mqtt', () => ({
  default: { connect: connectMock },
}));

import { isValidTelemetry, publishSessionConfig, SESSION_CONFIG_TOPIC } from './mqttClient';

const field = (value: number, unit = 'm', timestamp = 1700000000) => ({ value, unit, timestamp });

describe('mqttClient connection', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('connects to the broker over secure websockets using env config', async () => {
    vi.stubEnv('VITE_MQTT_HOST', 'broker.example.com');
    vi.stubEnv('VITE_MQTT_PORT', '8884');
    vi.stubEnv('VITE_MQTT_USERNAME', 'test-user');
    vi.stubEnv('VITE_MQTT_PASSWORD', 'test-pass');
    vi.resetModules();
    connectMock.mockClear();

    const mod = await import('./mqttClient');

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith('wss://broker.example.com:8884/mqtt', {
      username: 'test-user',
      password: 'test-pass',
    });
    expect(mod.mqttClient).toBe(connectMock.mock.results[0].value);
  });
});

describe('isValidTelemetry', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'telemetry'],
    ['a number', 42],
    ['a boolean', true],
    ['an array', []],
  ])('rejects %s', (_name, payload) => {
    expect(isValidTelemetry(payload)).toBe(false);
  });

  it('accepts a payload with only id and timestamp', () => {
    expect(isValidTelemetry({ id: 'rov-1', timestamp: 1700000000 })).toBe(true);
  });

  it('accepts a payload with well-formed telemetry fields', () => {
    const payload = {
      id: 'rov-1',
      timestamp: 1700000000,
      depth: field(3.2, 'm'),
      heading: field(270, 'deg'),
      temperature: field(-1.5, 'C'),
    };

    expect(isValidTelemetry(payload)).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('accepts extra properties on a telemetry field', () => {
    const payload = {
      id: 'rov-1',
      timestamp: 1,
      depth: { ...field(1), source: 'sensor-a' },
    };

    expect(isValidTelemetry(payload)).toBe(true);
  });

  it('accepts cardinal_direction as a plain string', () => {
    const payload = { id: 'rov-1', timestamp: 1, cardinal_direction: 'NE', depth: field(1) };

    expect(isValidTelemetry(payload)).toBe(true);
  });

  it('rejects a non-string cardinal_direction and warns', () => {
    const value = field(45, 'deg');
    const payload = { id: 'rov-1', timestamp: 1, cardinal_direction: value };

    expect(isValidTelemetry(payload)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('Invalid telemetry field: cardinal_direction', value);
  });

  it.each([
    ['missing id', { timestamp: 1 }],
    ['numeric id', { id: 1, timestamp: 1 }],
    ['missing timestamp', { id: 'rov-1' }],
    ['string timestamp', { id: 'rov-1', timestamp: '1700000000' }],
  ])('rejects payloads with %s', (_name, payload) => {
    expect(isValidTelemetry(payload)).toBe(false);
  });

  it.each([
    ['null', null],
    ['a bare number', 3.2],
    ['a string', '3.2'],
    ['a string value', { value: '3.2', unit: 'm', timestamp: 1 }],
    ['a numeric unit', { value: 3.2, unit: 1, timestamp: 1 }],
    ['a string timestamp', { value: 3.2, unit: 'm', timestamp: '1' }],
    ['a missing value', { unit: 'm', timestamp: 1 }],
    ['a missing unit', { value: 3.2, timestamp: 1 }],
    ['a missing timestamp', { value: 3.2, unit: 'm' }],
  ])('rejects a telemetry field that is %s and warns', (_name, value) => {
    const payload = { id: 'rov-1', timestamp: 1, depth: value };

    expect(isValidTelemetry(payload)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('Invalid telemetry field: depth', value);
  });

  it('rejects the whole payload if any single field is invalid', () => {
    const payload = {
      id: 'rov-1',
      timestamp: 1,
      depth: field(1),
      heading: field(90),
      pressure: { value: 'bad' },
    };

    expect(isValidTelemetry(payload)).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('publishSessionConfig', () => {
  const config: SessionConfig = {
    event: { id: 'evt-1', name: 'Regional', rov_id: 'rov-1' },
    mission: { id: 'mis-1', name: 'Mission 1' },
    tasks: [{ id: 'task-1', name: 'Iceberg tracking', assigned_to: 'copilot' }],
    published_at: '2026-11-04T10:00:00.000Z',
  };

  beforeEach(() => {
    publishMock.mockReset();
  });

  it('publishes the serialised config to the session topic with qos 1 and retain', async () => {
    publishMock.mockImplementation((_topic, _payload, _opts, cb) => cb());

    await publishSessionConfig(config);

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [topic, payload, opts] = publishMock.mock.calls[0];
    expect(topic).toBe(SESSION_CONFIG_TOPIC);
    expect(topic).toBe('session/config');
    expect(JSON.parse(payload)).toEqual(config);
    expect(opts).toEqual({ qos: 1, retain: true });
  });

  it('resolves once the broker acknowledges', async () => {
    publishMock.mockImplementation((_topic, _payload, _opts, cb) => cb(undefined));

    await expect(publishSessionConfig(config)).resolves.toBeUndefined();
  });

  it('rejects with the transport error when publishing fails', async () => {
    const error = new Error('connection lost');
    publishMock.mockImplementation((_topic, _payload, _opts, cb) => cb(error));

    await expect(publishSessionConfig(config)).rejects.toBe(error);
  });

  it('stays pending until the broker callback fires', async () => {
    let ack: ((err?: Error) => void) | undefined;
    publishMock.mockImplementation((_topic, _payload, _opts, cb) => {
      ack = cb;
    });

    let settled = false;
    const promise = publishSessionConfig(config).then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    ack?.();
    await promise;
    expect(settled).toBe(true);
  });
});
