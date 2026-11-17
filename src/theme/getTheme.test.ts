import { describe, it, expect } from 'vitest';
import { getTheme } from './getTheme';

describe('getTheme', () => {
  describe('light mode', () => {
    const theme = getTheme('light');

    it('uses the light primary palette', () => {
      expect(theme.palette.primary.light).toBe('#16213E');
      expect(theme.palette.primary.main).toBe('#f1f3faff');
      expect(theme.palette.primary.dark).toBe('#dfe6f1ff');
    });

    it('uses light backgrounds', () => {
      expect(theme.palette.background.default).toBe('#ffffffff');
      expect(theme.palette.background.paper).toBe('#f1f3faff');
    });

    it('uses dark text on a light background', () => {
      expect(theme.palette.text.primary).toBe('#000000');
      expect(theme.palette.text.disabled).toBe('#606060');
    });

    it('uses the light divider colour', () => {
      expect(theme.palette.divider).toBe('#90909087');
    });
  });

  describe('dark mode', () => {
    const theme = getTheme('dark');

    it('uses the dark primary palette', () => {
      expect(theme.palette.primary.light).toBe('#dfe6f1ff');
      expect(theme.palette.primary.main).toBe('#0F3460');
      expect(theme.palette.primary.dark).toBe('#16213E');
    });

    it('uses dark backgrounds', () => {
      expect(theme.palette.background.default).toBe('#1A1A2E');
      expect(theme.palette.background.paper).toBe('#0F3460');
    });

    it('uses light text on a dark background', () => {
      expect(theme.palette.text.primary).toBe('#ffffff');
      expect(theme.palette.text.disabled).toBe('#909090');
    });

    it('uses the dark divider colour', () => {
      expect(theme.palette.divider).toBe('#b0b0b07e');
    });
  });

  describe.each(['light', 'dark'] as const)('shared tokens (%s)', (mode) => {
    const theme = getTheme(mode);

    it('uses the same status and accent colours', () => {
      expect(theme.palette.secondary.main).toBe('#E94560');
      expect(theme.palette.success.main).toBe('#00FF88');
      expect(theme.palette.warning.main).toBe('#f59e0b');
      expect(theme.palette.error.main).toBe('#ef4444');
      expect(theme.palette.text.secondary).toBe('#E94560');
    });

    it('lets MUI derive contrast text for every palette colour', () => {
      for (const key of ['primary', 'secondary', 'success', 'warning', 'error'] as const) {
        expect(theme.palette[key].contrastText).toMatch(/^(#|rgb)/);
      }
    });

    it('uses the Inter font stack', () => {
      expect(theme.typography.fontFamily).toBe('"Inter", "Roboto", "Arial", sans-serif');
    });

    it.each([
      ['h1', '2rem'],
      ['h2', '1.75rem'],
      ['h3', '1.5rem'],
      ['h4', '1.25rem'],
      ['h5', '1rem'],
      ['h6', '0.875rem'],
    ] as const)('sizes %s at %s with bold weight', (variant, size) => {
      expect(theme.typography[variant].fontSize).toBe(size);
      expect(theme.typography[variant].fontWeight).toBe(700);
    });

    it('sizes body text', () => {
      expect(theme.typography.body1.fontSize).toBe('1rem');
      expect(theme.typography.body2.fontSize).toBe('0.875rem');
    });

    it('uses an 8px spacing unit', () => {
      expect(theme.spacing(1)).toBe('8px');
      expect(theme.spacing(2)).toBe('16px');
      expect(theme.spacing(0.5)).toBe('4px');
    });
  });

  it('returns a new theme object on each call', () => {
    expect(getTheme('dark')).not.toBe(getTheme('dark'));
  });

  it('produces different palettes for light and dark', () => {
    expect(getTheme('light').palette.background.default).not.toBe(
      getTheme('dark').palette.background.default,
    );
  });
});
