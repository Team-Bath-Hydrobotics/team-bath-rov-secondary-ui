import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { AppStateContextValue } from '../types';

// mqttClient.ts calls mqtt.connect() at import time, so the module is mocked
// before anything imports it. The fake client records its listeners so the
// tests can deliver broker events with emit().
const { fakeClient, listeners } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<string, Set<Listener>>();

  const fakeClient = {
    on: vi.fn((event: string, listener: Listener) => {
      const existing = listeners.get(event) ?? new Set<Listener>();
      existing.add(listener);
      listeners.set(event, existing);
    }),
    off: vi.fn((event: string, listener: Listener) => {
      listeners.get(event)?.delete(listener);
    }),
    subscribe: vi.fn<(topic: string) => void>(),
    unsubscribe: vi.fn<(topic: string) => void>(),
    publish: vi.fn(),
  };

  return { fakeClient, listeners };
});

vi.mock('mqtt', () => ({
  default: { connect: vi.fn(() => fakeClient) },
}));

import { AppStateContext, useAppStateContext } from '../context/AppStateContext';
import { useMqtt } from '../hooks/useMqtt';
import { AppStateProvider } from './AppStateProvider';
import { MqttProvider } from './MqttProvider';

const SUBSCRIBED_TOPIC = 'hydrobotics/rov/<rov_id>/telemetry';

const emit = (event: string, ...args: unknown[]) => {
  [...(listeners.get(event) ?? [])].forEach((listener) => listener(...args));
};

const listenerCount = (event: string) => listeners.get(event)?.size ?? 0;

// mqtt.js delivers payloads as a Buffer; the provider only calls toString().
const rawPayload = (text: string) => ({ toString: () => text });
const jsonPayload = (data: unknown) => rawPayload(JSON.stringify(data));

const emitTelemetry = (data: unknown) => {
  emit('message', SUBSCRIBED_TOPIC, jsonPayload(data));
};

const point = (value: number, unit = 'm') => ({ value, unit, timestamp: 1700000000 });

const makeTelemetry = (fields: Record<string, unknown> = {}) => ({
  id: 'rov-1',
  timestamp: 1700000000,
  ...fields,
});

interface WrapperProps {
  children: ReactNode;
}

describe('MqttProvider', () => {
  let pendingFrames: FrameRequestCallback[];
  let requestFrameMock: ReturnType<typeof vi.fn<typeof requestAnimationFrame>>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  /** Runs every animation frame callback that has been requested so far. */
  const flushFrames = () => {
    act(() => {
      const frames = pendingFrames;
      pendingFrames = [];
      frames.forEach((callback) => callback(0));
    });
  };

  /**
   * Renders MqttProvider inside an AppState context whose updateTelemetry is a
   * spy (the only part of app state the provider uses).
   */
  const renderWithTelemetrySpy = () => {
    const updateTelemetry = vi.fn<AppStateContextValue['updateTelemetry']>();
    const appState = { updateTelemetry } as unknown as AppStateContextValue;
    const wrapper = ({ children }: WrapperProps) => (
      <AppStateContext.Provider value={appState}>
        <MqttProvider>{children}</MqttProvider>
      </AppStateContext.Provider>
    );

    const view = renderHook(() => useMqtt(), { wrapper });
    return { ...view, updateTelemetry };
  };

  beforeEach(() => {
    listeners.clear();
    fakeClient.on.mockClear();
    fakeClient.off.mockClear();
    fakeClient.subscribe.mockClear();
    fakeClient.unsubscribe.mockClear();

    pendingFrames = [];
    requestFrameMock = vi.fn<typeof requestAnimationFrame>((callback) => {
      pendingFrames.push(callback);
      return pendingFrames.length;
    });
    vi.stubGlobal('requestAnimationFrame', requestFrameMock);

    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('throws when rendered outside AppStateProvider', () => {
    // React logs the thrown error; silence it to keep test output clean.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <MqttProvider>
          <p>child content</p>
        </MqttProvider>,
      ),
    ).toThrow('useAppStateContext must be used within a AppStateProvider');

    errorSpy.mockRestore();
  });

  it('renders its children', () => {
    render(
      <AppStateProvider>
        <MqttProvider>
          <p>child content</p>
        </MqttProvider>
      </AppStateProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  describe('subscription', () => {
    it('subscribes to the telemetry topic on mount', () => {
      renderWithTelemetrySpy();

      // Current behaviour: the topic still contains the literal "<rov_id>"
      // placeholder rather than a real ROV id.
      expect(fakeClient.subscribe).toHaveBeenCalledTimes(1);
      expect(fakeClient.subscribe).toHaveBeenCalledWith(SUBSCRIBED_TOPIC);
    });

    it('listens for message, connect and close events', () => {
      renderWithTelemetrySpy();

      expect(listenerCount('message')).toBe(1);
      expect(listenerCount('connect')).toBe(1);
      expect(listenerCount('close')).toBe(1);
    });

    it('does not subscribe again when it rerenders or the connection changes', () => {
      const { rerender } = renderWithTelemetrySpy();

      rerender();
      act(() => {
        emit('connect');
      });

      expect(fakeClient.subscribe).toHaveBeenCalledTimes(1);
      expect(listenerCount('message')).toBe(1);
    });

    it('removes exactly the listeners it added when it unmounts', () => {
      const { unmount } = renderWithTelemetrySpy();
      const added = fakeClient.on.mock.calls.map(([event, listener]) => [event, listener]);

      unmount();

      expect(fakeClient.off.mock.calls).toEqual(added);
      expect(listenerCount('message')).toBe(0);
      expect(listenerCount('connect')).toBe(0);
      expect(listenerCount('close')).toBe(0);
    });

    it('unsubscribes from "rov/telemetry" when it unmounts', () => {
      // Current behaviour: this is not the topic that was subscribed to, so
      // the real subscription is never removed.
      const { unmount } = renderWithTelemetrySpy();

      unmount();

      expect(fakeClient.unsubscribe).toHaveBeenCalledTimes(1);
      expect(fakeClient.unsubscribe).toHaveBeenCalledWith('rov/telemetry');
    });
  });

  describe('connection status', () => {
    it('is disconnected until the client connects', () => {
      const { result } = renderWithTelemetrySpy();

      expect(result.current).toEqual({ connected: false });
    });

    it('becomes connected on the connect event', () => {
      const { result } = renderWithTelemetrySpy();

      act(() => {
        emit('connect');
      });

      expect(result.current).toEqual({ connected: true });
    });

    it('becomes disconnected on the close event', () => {
      const { result } = renderWithTelemetrySpy();
      act(() => {
        emit('connect');
      });

      act(() => {
        emit('close');
      });

      expect(result.current).toEqual({ connected: false });
    });

    it('becomes connected again after a reconnect', () => {
      const { result } = renderWithTelemetrySpy();
      act(() => {
        emit('connect');
        emit('close');
      });

      act(() => {
        emit('connect');
      });

      expect(result.current).toEqual({ connected: true });
    });

    it('keeps the same context value while the status is unchanged', () => {
      const { result, rerender } = renderWithTelemetrySpy();
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });
  });

  describe('telemetry messages', () => {
    it('passes valid telemetry to app state on the next animation frame', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();
      const telemetry = makeTelemetry({ depth: point(3.2) });

      emitTelemetry(telemetry);

      expect(requestFrameMock).toHaveBeenCalledTimes(1);
      expect(updateTelemetry).not.toHaveBeenCalled();

      flushFrames();

      expect(updateTelemetry).toHaveBeenCalledTimes(1);
      expect(updateTelemetry).toHaveBeenCalledWith(telemetry);
    });

    it('sends only the latest message when several arrive within one frame', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();
      const latest = makeTelemetry({ depth: point(3) });

      emitTelemetry(makeTelemetry({ depth: point(1) }));
      emitTelemetry(makeTelemetry({ depth: point(2) }));
      emitTelemetry(latest);
      flushFrames();

      expect(requestFrameMock).toHaveBeenCalledTimes(1);
      expect(updateTelemetry).toHaveBeenCalledTimes(1);
      expect(updateTelemetry).toHaveBeenCalledWith(latest);
    });

    it('schedules a new frame for messages that arrive after the previous frame', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();
      const first = makeTelemetry({ depth: point(1) });
      const second = makeTelemetry({ depth: point(2) });

      emitTelemetry(first);
      flushFrames();
      emitTelemetry(second);
      flushFrames();

      expect(requestFrameMock).toHaveBeenCalledTimes(2);
      expect(updateTelemetry.mock.calls).toEqual([[first], [second]]);
    });

    it('accepts telemetry on any topic', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();
      const telemetry = makeTelemetry({ depth: point(3.2) });

      emit('message', 'some/other/topic', jsonPayload(telemetry));
      flushFrames();

      expect(updateTelemetry).toHaveBeenCalledWith(telemetry);
    });

    it('warns and ignores a payload that is not valid telemetry', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();
      const invalid = { id: 'rov-1' };

      emitTelemetry(invalid);
      flushFrames();

      expect(warnSpy).toHaveBeenCalledWith(
        '[MqttProvider] Received invalid telemetry payload:',
        invalid,
      );
      expect(requestFrameMock).not.toHaveBeenCalled();
      expect(updateTelemetry).not.toHaveBeenCalled();
    });

    it('ignores a payload with a malformed telemetry field', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();

      emitTelemetry(makeTelemetry({ depth: { value: 'deep' } }));
      flushFrames();

      expect(updateTelemetry).not.toHaveBeenCalled();
    });

    it('still delivers an earlier valid message when an invalid one follows it', () => {
      const { updateTelemetry } = renderWithTelemetrySpy();
      const valid = makeTelemetry({ depth: point(3.2) });

      emitTelemetry(valid);
      emitTelemetry({ id: 'rov-1' });
      flushFrames();

      expect(updateTelemetry).toHaveBeenCalledTimes(1);
      expect(updateTelemetry).toHaveBeenCalledWith(valid);
    });

    it('throws out of the message handler when the payload is not JSON', () => {
      // Current behaviour: JSON.parse is not guarded, so a non-JSON message
      // raises a SyntaxError inside the MQTT client's event emitter.
      const { updateTelemetry } = renderWithTelemetrySpy();

      expect(() => emit('message', SUBSCRIBED_TOPIC, rawPayload('not json'))).toThrow(SyntaxError);

      expect(requestFrameMock).not.toHaveBeenCalled();
      expect(updateTelemetry).not.toHaveBeenCalled();
    });

    it('still delivers a frame that was pending when it unmounted', () => {
      // Current behaviour: the scheduled animation frame is not cancelled on
      // unmount, so the last message is still written to app state.
      const { updateTelemetry, unmount } = renderWithTelemetrySpy();
      const telemetry = makeTelemetry({ depth: point(3.2) });
      emitTelemetry(telemetry);

      unmount();
      flushFrames();

      expect(updateTelemetry).toHaveBeenCalledWith(telemetry);
    });
  });

  describe('with AppStateProvider', () => {
    const wrapper = ({ children }: WrapperProps) => (
      <AppStateProvider>
        <MqttProvider>{children}</MqttProvider>
      </AppStateProvider>
    );

    const renderWithAppState = () =>
      renderHook(() => ({ mqtt: useMqtt(), app: useAppStateContext() }), { wrapper });

    it('writes received telemetry into app state', () => {
      const { result } = renderWithAppState();

      emitTelemetry(makeTelemetry({ depth: point(3.2) }));
      flushFrames();

      expect(result.current.app.state.telemetry).toEqual(makeTelemetry({ depth: point(3.2) }));
    });

    it('merges telemetry from later frames with what was already received', () => {
      const { result } = renderWithAppState();

      emitTelemetry(makeTelemetry({ depth: point(3.2) }));
      flushFrames();
      emitTelemetry(makeTelemetry({ ambient_temperature: point(4, 'C') }));
      flushFrames();

      expect(result.current.app.state.telemetry).toMatchObject({
        depth: point(3.2),
        ambient_temperature: point(4, 'C'),
      });
    });

    it('stays subscribed while telemetry updates app state', () => {
      const { result } = renderWithAppState();

      emitTelemetry(makeTelemetry({ depth: point(3.2) }));
      flushFrames();
      act(() => {
        emit('connect');
      });

      expect(result.current.mqtt).toEqual({ connected: true });
      expect(fakeClient.subscribe).toHaveBeenCalledTimes(1);
      expect(fakeClient.unsubscribe).not.toHaveBeenCalled();
    });
  });
});
