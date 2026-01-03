import { Paper, Box, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { RecordingStatus } from '../RecordingStatus';

interface CameraTileProps {
  cameraId: string;
  name: string;
  enabled: boolean;
  isRecording: boolean;
}

/**
 * Camera tile displaying a placeholder for the video feed.
 * Shows greyed-out state when disabled, recording indicator when active.
 */
export const CameraTile = ({ name, enabled, isRecording }: CameraTileProps) => {
  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        overflow: 'hidden',
        // Greyed-out effect when disabled
        opacity: enabled ? 1 : 0.4,
        filter: enabled ? 'none' : 'grayscale(100%)',
        transition: 'opacity 0.3s, filter 0.3s',
      }}
    >
      {/* Camera placeholder content */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: enabled ? 'grey.900' : 'grey.300',
          gap: 1,
        }}
      >
        {enabled ? (
          <VideocamIcon sx={{ fontSize: 48, color: 'grey.600' }} />
        ) : (
          <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.500' }} />
        )}
        <Typography variant="body2" color={enabled ? 'grey.500' : 'grey.600'}>
          {name}
        </Typography>
        {!enabled && (
          <Typography variant="caption" color="grey.500">
            Disabled
          </Typography>
        )}
      </Box>

      {/* Recording status overlay - only shown when enabled */}
      {enabled && <RecordingStatus isRecording={isRecording} />}
    </Paper>
  );
};
