import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeContext, useThemeMode } from './ThemeContext';

describe('useThemeMode', () => {
  it('throws a helpful error when used outside ThemeProvider', () => {
    // React logs the thrown error; silence it to keep test output clean.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useThemeMode())).toThrow(
      'useThemeMode must be used within ThemeProvider',
    );

    errorSpy.mockRestore();
  });

  it('returns the value supplied by ThemeContext', () => {
    const value = { mode: 'light' as const, toggleTheme: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );

    const { result } = renderHook(() => useThemeMode(), { wrapper });

    expect(result.current).toBe(value);
    result.current.toggleTheme();
    expect(value.toggleTheme).toHaveBeenCalledTimes(1);
  });
});
