import { describe, it, expect } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSidebarContext } from '../context/SidebarContext';
import { SidebarProvider } from './SidebarProvider';

const SidebarProbe = () => {
  const { sidebarContent, setSidebarContent } = useSidebarContext();

  const handleSetCameras = () => {
    setSidebarContent(<p>camera toggles</p>);
  };

  const handleSetTelemetry = () => {
    setSidebarContent(<p>telemetry toggles</p>);
  };

  const handleClear = () => {
    setSidebarContent(null);
  };

  return (
    <>
      <aside data-testid="sidebar">{sidebarContent}</aside>
      <button onClick={handleSetCameras}>Cameras</button>
      <button onClick={handleSetTelemetry}>Telemetry</button>
      <button onClick={handleClear}>Clear</button>
    </>
  );
};

const renderWithProvider = () =>
  render(
    <SidebarProvider>
      <SidebarProbe />
    </SidebarProvider>,
  );

describe('SidebarProvider', () => {
  it('renders its children', () => {
    render(
      <SidebarProvider>
        <p>child content</p>
      </SidebarProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('has no sidebar content by default', () => {
    renderWithProvider();

    expect(screen.getByTestId('sidebar')).toBeEmptyDOMElement();
  });

  it('shows the content passed to setSidebarContent', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Cameras' }));

    expect(screen.getByTestId('sidebar')).toHaveTextContent('camera toggles');
  });

  it('replaces the previous content when set again', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Cameras' }));
    await user.click(screen.getByRole('button', { name: 'Telemetry' }));

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveTextContent('telemetry toggles');
    expect(sidebar).not.toHaveTextContent('camera toggles');
  });

  it('clears the content when set to null', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Cameras' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('sidebar')).toBeEmptyDOMElement();
  });

  it('keeps setSidebarContent stable when the content changes', () => {
    // useSidebarContent lists the setter as an effect dependency, so a new
    // identity on every update would re-run that effect in a loop.
    const { result } = renderHook(() => useSidebarContext(), { wrapper: SidebarProvider });
    const initialSetter = result.current.setSidebarContent;

    act(() => {
      result.current.setSidebarContent('updated');
    });

    expect(result.current.sidebarContent).toBe('updated');
    expect(result.current.setSidebarContent).toBe(initialSetter);
  });

  it('keeps each provider instance independent', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SidebarProvider>
          <SidebarProbe />
        </SidebarProvider>
        <SidebarProvider>
          <SidebarProbe />
        </SidebarProvider>
      </>,
    );

    const [firstButton] = screen.getAllByRole('button', { name: 'Cameras' });
    await user.click(firstButton);

    const [firstSidebar, secondSidebar] = screen.getAllByTestId('sidebar');
    expect(firstSidebar).toHaveTextContent('camera toggles');
    expect(secondSidebar).toBeEmptyDOMElement();
  });
});
