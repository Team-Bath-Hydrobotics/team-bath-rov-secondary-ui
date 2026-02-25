import { Button, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

interface CaptureButtonProps {
  onCapture: () => void;
}

export const CaptureButton = ({ onCapture }: CaptureButtonProps) => (
  <Button
    variant="contained"
    onClick={onCapture}
    startIcon={<CameraAltIcon />}
    sx={{
      flexGrow: 0.2,
      bgcolor: 'secondary.main',
      borderRadius: 2,
      textTransform: 'none',
      color: 'text.primary',
    }}
  >
    <Typography variant="h3">Capture Screenshot</Typography>
  </Button>
);
