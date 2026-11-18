import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useClock } from './useClock';

const START = new Date('2026-11-10T12:00:00.000Z');

describe('useClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time on first render', () => {
    const { result } = renderHook(() => useClock());

    expect(result.current).toEqual(START);
  });

  it('does not update before a full second has passed', () => {
    const { result } = renderHook(() => useClock());

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(result.current).toEqual(START);
  });

  it('updates to the new time after one second', () => {
    const { result } = renderHook(() => useClock());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toEqual(new Date('2026-11-10T12:00:01.000Z'));
  });

  it('keeps ticking every second', () => {
    const { result } = renderHook(() => useClock());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toEqual(new Date('2026-11-10T12:00:05.000Z'));
  });

  it('returns a new Date instance on each tick', () => {
    const { result } = renderHook(() => useClock());
    const first = result.current;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).not.toBe(first);
  });

  it('clears its interval on unmount', () => {
    const { unmount } = renderHook(() => useClock());
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
