import { Box } from '@mui/material'
import { Typography } from '@mui/material'
import { BrokerStatus, ClockStatus, DataRateStatus } from '../../components/Status';
import { RenderModeToggleButton } from '../../components/RenderModeToggleButton.tsx';
import { useThemeMode } from '../../theme/ThemeContext.tsx';

interface MainContentLayoutProps {
    children?: React.ReactNode;
    name: string;
}

export const MainContentLayout = ({ children, name }: MainContentLayoutProps) => {
  const { mode, toggleTheme } = useThemeMode()
  return (
    <Box display="flex" flexDirection="column" height="100vh" flexGrow={1}>
      <Box display="flex" flexDirection="row" sx={{backgroundColor:"primary.main", height:"60px"}}>
        <Box sx={{padding:2}}>
          <Typography variant="h4" gutterBottom>
            {name}
          </Typography>
        </Box>
        <Box sx={{padding:2, overflow: 'hidden'}} flexGrow={1} display="flex" justifyContent="flex-end" alignItems="center">
          <ClockStatus/>
          <RenderModeToggleButton darkModeEnabled={mode === 'dark'} onToggle={toggleTheme} />
        </Box>
      </Box>
      <Box flexGrow={1} sx={{backgroundColor:"background.default", overflow: 'auto'}}>
        {children}
      </Box>
      <Box sx={{backgroundColor:"primary.main", height:"40px", display: 'flex', alignItems: 'center', px: 2, gap: 2}}>
        <BrokerStatus />
        <DataRateStatus />
        <Typography 
            variant="body2"
            sx={{
                color: "text.primary", 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexShrink: 1
            }}
            >
            © {new Date().getFullYear()} Bath Hydrobotics
        </Typography>
      </Box>
    </Box>
  )
}