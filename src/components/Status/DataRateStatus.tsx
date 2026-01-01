import { Typography } from '@mui/material'

export function DataRateStatus() {
  const rate = 'N/A'

  return (
    <Typography variant="body1" color="text.primary" sx={{display: { xs: 'none', sm: 'block' }}}>
      {rate} Mbps
    </Typography>
  )
}