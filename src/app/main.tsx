import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.tsx'
import { ThemeProvider } from '../theme/ThemeProvider'
import { SidebarProvider } from '../providers/SidebarProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SidebarProvider>
       <App />
      </SidebarProvider>
    </ThemeProvider>
  </StrictMode>,
)
