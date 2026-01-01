import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
export function BrokerStatus() {
  const isConnected: boolean | null = null

  return (
    <Box display="flex" alignItems="center" gap={1}>
       <FiberManualRecordIcon 
        sx={{
          display: { xs: 'block', sm: 'block' },
          fontSize: 16,
          color: isConnected === null ? 'grey' : isConnected ? 'success.main' : 'error.main',
        }}
      />
      <Typography 
        variant="body1"
        color="text.primary"
        sx={{
          display: { xs: 'none', sm: 'block' },
        }}
      >
        MQTT: {isConnected === null ? 'N/A' : isConnected ? 'Connected' : 'Disconnected'}
      </Typography>
    </Box>
  )
}