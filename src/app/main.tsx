import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import App from './App.tsx';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SidebarProvider } from '../providers/SidebarProvider';
import { AppStateProvider } from '../providers/AppStateProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <ThemeProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </ThemeProvider>
    </AppStateProvider>
  </StrictMode>,
);
