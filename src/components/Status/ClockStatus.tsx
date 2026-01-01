import { Typography } from '@mui/material'
import { useClock } from '../../hooks/useClock'

export function ClockStatus() {
  const now = useClock()

  return (
    <Typography variant="body1" color="text.primary">
      {now.toLocaleTimeString()}
    </Typography>
  )
}
