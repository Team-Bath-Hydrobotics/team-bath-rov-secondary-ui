import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from '@mui/material/styles';
import { ThemeProvider } from './ThemeProvider';
import { useThemeMode } from './ThemeContext';

const ThemeProbe = () => {
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();

  const handleClick = () => {
    toggleTheme();
  };

  return (
    <>
      <span data-testid="mode">{mode}</span>
      <span data-testid="background">{theme.palette.background.default}</span>
      <span data-testid="text">{theme.palette.text.primary}</span>
      <button onClick={handleClick}>Toggle</button>
    </>
  );
};

const renderWithProvider = () =>
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

describe('ThemeProvider', () => {
  it('renders its children', () => {
    render(
      <ThemeProvider>
        <p>child content</p>
      </ThemeProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('defaults to dark mode', () => {
    renderWithProvider();

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  });

  it('supplies the dark MUI theme by default', () => {
    renderWithProvider();

    expect(screen.getByTestId('background')).toHaveTextContent('#1A1A2E');
    expect(screen.getByTestId('text')).toHaveTextContent('#ffffff');
  });

  it('switches to light mode and the light MUI theme when toggled', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(screen.getByTestId('background')).toHaveTextContent('#ffffffff');
    expect(screen.getByTestId('text')).toHaveTextContent('#000000');
  });

  it('switches back to dark mode when toggled twice', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    const button = screen.getByRole('button', { name: 'Toggle' });

    await user.click(button);
    await user.click(button);

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('background')).toHaveTextContent('#1A1A2E');
  });

  it('keeps each provider instance independent', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
      </>,
    );

    const [firstButton] = screen.getAllByRole('button', { name: 'Toggle' });
    await user.click(firstButton);

    const modes = screen.getAllByTestId('mode').map((el) => el.textContent);
    expect(modes).toEqual(['light', 'dark']);
  });
});
