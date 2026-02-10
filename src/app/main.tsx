import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import App from './App.tsx';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SidebarProvider } from '../providers/SidebarProvider';
import { AppStateProvider } from '../providers/AppStateProvider';
import { MqttProvider } from '../providers/MqttProvider.tsx';
import { VideoStreamProvider } from '../providers/VideoStreamProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <MqttProvider>
        <VideoStreamProvider>
          <ThemeProvider>
            <SidebarProvider>
              <App />
            </SidebarProvider>
          </ThemeProvider>
        </VideoStreamProvider>
      </MqttProvider>
    </AppStateProvider>
  </StrictMode>,
);
