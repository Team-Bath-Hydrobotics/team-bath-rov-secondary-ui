import { Typography } from '@mui/material'

export function RecordingStatus() {
  const isRecording = false

  return (
    <Typography variant="body1"  color="text.primary">
      {isRecording ? "Recording" : "Not Recording"}
    </Typography>
  )
}