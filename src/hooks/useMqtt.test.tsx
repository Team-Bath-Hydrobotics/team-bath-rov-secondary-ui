import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MqttContext } from '../context/MqttContext';
import { useMqtt } from './useMqtt';

interface WrapperProps {
  children: ReactNode;
}

describe('useMqtt', () => {
  it('returns undefined when used outside MqttProvider', () => {
    // Unlike useMqttContext this hook does not throw, so callers must handle
    // the missing provider themselves (e.g. `mqtt?.connected ?? false`).
    const { result } = renderHook(() => useMqtt());

    expect(result.current).toBeUndefined();
  });

  it('returns the value supplied by MqttContext', () => {
    const value = { connected: true };
    const wrapper = ({ children }: WrapperProps) => (
      <MqttContext.Provider value={value}>{children}</MqttContext.Provider>
    );

    const { result } = renderHook(() => useMqtt(), { wrapper });

    expect(result.current).toBe(value);
  });

  it('reflects a changed context value on rerender', () => {
    let value = { connected: false };
    const wrapper = ({ children }: WrapperProps) => (
      <MqttContext.Provider value={value}>{children}</MqttContext.Provider>
    );

    const { result, rerender } = renderHook(() => useMqtt(), { wrapper });
    expect(result.current?.connected).toBe(false);

    value = { connected: true };
    rerender();

    expect(result.current?.connected).toBe(true);
  });
});
