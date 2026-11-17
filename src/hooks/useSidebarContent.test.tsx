import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SidebarContext, useSidebarContext } from '../context/SidebarContext';
import { SidebarProvider } from '../providers/SidebarProvider';
import { useSidebarContent } from './useSidebarContent';

interface WrapperProps {
  children: ReactNode;
}

type Factory = () => ReactNode;

// Wraps the hook in a context whose setter is a spy, so each call can be asserted.
const renderWithSetter = (initialFactory: Factory) => {
  const setSidebarContent = vi.fn<(content: ReactNode) => void>();
  const value = { sidebarContent: null, setSidebarContent };
  const wrapper = ({ children }: WrapperProps) => (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );

  const view = renderHook(({ factory }: { factory: Factory }) => useSidebarContent(factory), {
    wrapper,
    initialProps: { factory: initialFactory },
  });

  return { ...view, setSidebarContent };
};

describe('useSidebarContent', () => {
  it('throws when used outside SidebarProvider', () => {
    // React logs the thrown error; silence it to keep test output clean.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useSidebarContent(() => null))).toThrow(
      'useSidebarContext must be used within SidebarProvider',
    );

    errorSpy.mockRestore();
  });

  it('sets the sidebar content to the factory result on mount', () => {
    const content = <p>telemetry toggles</p>;
    const factory = vi.fn<Factory>(() => content);

    const { setSidebarContent } = renderWithSetter(factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(setSidebarContent).toHaveBeenCalledTimes(1);
    expect(setSidebarContent).toHaveBeenCalledWith(content);
  });

  it('clears the sidebar content on unmount', () => {
    const { setSidebarContent, unmount } = renderWithSetter(() => 'content');
    setSidebarContent.mockClear();

    unmount();

    expect(setSidebarContent).toHaveBeenCalledTimes(1);
    expect(setSidebarContent).toHaveBeenCalledWith(null);
  });

  it('does not call the factory again when rerendered with the same factory', () => {
    const factory = vi.fn<Factory>(() => 'content');
    const { setSidebarContent, rerender } = renderWithSetter(factory);

    rerender({ factory });
    rerender({ factory });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(setSidebarContent).toHaveBeenCalledTimes(1);
  });

  it('clears the old content then sets the new content when the factory changes', () => {
    const { setSidebarContent, rerender } = renderWithSetter(() => 'first');
    setSidebarContent.mockClear();

    rerender({ factory: () => 'second' });

    expect(setSidebarContent.mock.calls).toEqual([[null], ['second']]);
  });

  describe('with SidebarProvider', () => {
    const SidebarSlot = () => {
      const { sidebarContent } = useSidebarContext();
      return <aside data-testid="sidebar">{sidebarContent}</aside>;
    };

    const pageFactory = () => <p>page sidebar</p>;

    const Page = () => {
      useSidebarContent(pageFactory);
      return <main>page</main>;
    };

    const App = ({ showPage }: { showPage: boolean }) => (
      <SidebarProvider>
        <SidebarSlot />
        {showPage && <Page />}
      </SidebarProvider>
    );

    it('shows the page content in the sidebar while the page is mounted', () => {
      render(<App showPage />);

      expect(screen.getByTestId('sidebar')).toHaveTextContent('page sidebar');
    });

    it('removes the content from the sidebar when the page unmounts', () => {
      const { rerender } = render(<App showPage />);

      rerender(<App showPage={false} />);

      expect(screen.getByTestId('sidebar')).toBeEmptyDOMElement();
    });
  });
});
