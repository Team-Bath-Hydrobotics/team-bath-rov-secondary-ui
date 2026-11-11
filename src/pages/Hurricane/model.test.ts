import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  makePrompt,
  observationsCsv,
  predictNext,
  readObservations,
  SAMPLE_OBSERVATIONS,
} from './model';

afterEach(() => vi.unstubAllGlobals());

describe('Observation data', () => {
  it.each([{}, null, 'not an array'])('ignores non-array saved data %#', (value) => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(value) });
    expect(readObservations()).toEqual([]);
  });

  it('filters invalid metadata while preserving valid backend observations', () => {
    const valid = {
      ...SAMPLE_OBSERVATIONS[0],
      method: 'backend',
      model: 'eye-v1',
      timestamp: '2026-11-09T12:00:00Z',
    };
    const invalid = [
      { id: 1 },
      { source: 1 },
      { latitude: '12' },
      { longitude: '0' },
      { longitude: 181 },
      { method: 'other' },
      { timestamp: 42 },
      { timestamp: 'invalid' },
      { model: 42 },
    ].map((patch) => ({ ...valid, ...patch }));
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify([false, ...invalid, valid, { ...valid, method: 'demo' }]),
    });
    expect(readObservations()).toEqual([valid, { ...valid, method: 'demo' }]);
  });

  it('retains available observation times in prompts without making up missing ones', () => {
    const prompt = makePrompt([
      { ...SAMPLE_OBSERVATIONS[0], timestamp: '2026-11-09T12:00:00Z' },
      SAMPLE_OBSERVATIONS[1],
    ]);
    expect(prompt).toContain('(12, -45) at 2026-11-09T12:00:00Z');
    expect(prompt).toContain('(14, -50) (time unavailable)');
  });

  it('exports ordered coordinates and distinguishes detected from simulated observations', () => {
    expect(
      observationsCsv([{ ...SAMPLE_OBSERVATIONS[0], method: 'backend' }, SAMPLE_OBSERVATIONS[1]]),
    ).toBe('observation,latitude,longitude,method\n1,12,-45,Detection\n2,14,-50,Simulated');
    expect(observationsCsv([])).toBe('observation,latitude,longitude,method\n');
  });

  it.each([
    [80, 89, 90],
    [-80, -89, -90],
  ])('limits extrapolation at the poles %#', (a, b, expected) => {
    expect(
      predictNext([
        { ...SAMPLE_OBSERVATIONS[0], latitude: a },
        { ...SAMPLE_OBSERVATIONS[1], latitude: b },
      ])?.latitude,
    ).toBe(expected);
  });
});
