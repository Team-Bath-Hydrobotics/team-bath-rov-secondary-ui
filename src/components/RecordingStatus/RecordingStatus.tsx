import { Box, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface RecordingStatusProps {
  /** Whether recording is active */
  isRecording: boolean;
  /** Show "REC" label next to the dot (default: true) */
  showLabel?: boolean;
}

/**
 * Recording indicator overlay with pulsing red dot.
 * Returns null when not recording (renders nothing).
 */
export const RecordingStatus = ({ isRecording, showLabel = true }: RecordingStatusProps) => {
  // Don't render anything if not recording
  if (!isRecording) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      {/* Pulsing red dot */}
      <FiberManualRecordIcon
        sx={{
          color: 'error.main',
          fontSize: 14,
          // CSS keyframe animation for pulsing effect
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.4 },
          },
        }}
      />
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
          }}
        >
          REC
        </Typography>
      )}
    </Box>
  );
};
