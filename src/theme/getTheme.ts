import { createTheme} from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    primary: {
      light: mode === 'light' ? '#16213E' : '#dfe6f1ff',
      main: mode === 'light' ? '#f1f3faff' : '#0F3460',
      dark: mode === 'light' ? '#dfe6f1ff' : '#16213E',
    },
    secondary: {
      main: mode === 'light' ? '#E94560' : '#E94560',
    },
    success: {
      main: mode === 'light' ? '#00FF88' : '#00FF88',
    },
    warning:{
      main: mode === 'light' ? '#f59e0b' : '#f59e0b',
    },
    error: {
      main: mode === 'light' ? '#ef4444' : '#ef4444',
    },
    background: {
      default: mode === 'light' ? '#ffffffff' : '#1A1A2E',
      paper: mode === 'light' ? '#f1f3faff' : '#0F3460',
    },
    text:{
        primary: mode === 'light' ? '#000000' : '#ffffff',
        secondary: mode === 'light' ? '#E94560' : '#E94560',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    h3: { fontSize: '1.5rem', fontWeight: 700 },
    h4: { fontSize: '1.25rem', fontWeight: 700 },
    h5: { fontSize: '1rem', fontWeight: 700 },
    h6: { fontSize: '0.875rem', fontWeight: 700 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
  },
  spacing: 8, // MUI spacing unit, can be used like theme.spacing(2)
})