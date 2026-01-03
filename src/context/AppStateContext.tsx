import { createContext, useContext } from 'react';
import type { AppStateContextValue } from '../types/AppState';

export const AppStateContext = createContext<AppStateContextValue | null>(null);

/**
 * Hook to access the AppState context.
 * Must be used within a AppStateProvider.
 */
export const useAppStateContext = (): AppStateContextValue => {
  const context = useContext(AppStateContext);

  if (context === null) {
    throw new Error('useAppStateContext must be used within a AppStateProvider');
  }

  return context;
};
