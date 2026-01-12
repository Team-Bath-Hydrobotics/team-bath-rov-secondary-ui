import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import RadarIcon from '@mui/icons-material/Radar';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';

// SonarView runs on port 7077 - see https://docs.ceruleansonar.com/c/sonarview
const DEFAULT_SONARVIEW_URL = 'http://localhost:7077';
const SONARVIEW_STATUS_ENDPOINT = 'http://localhost:7077/status';

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error';

interface SonarPlaceholderProps {
  /** Custom URL for SonarView server (default: http://localhost:8000) */
  sonarViewUrl?: string;
  /** Enable embedded iframe mode instead of new tab */
  enableEmbedded?: boolean;
}

/**
 * SonarView launcher component.
 * Opens SonarView web interface in a new tab or embedded modal.
 */
export const SonarPlaceholder = ({
  sonarViewUrl: initialUrl = DEFAULT_SONARVIEW_URL,
  enableEmbedded = false,
}: SonarPlaceholderProps) => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [sonarViewUrl, setSonarViewUrl] = useState(initialUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Check if SonarView/SonarLink server is reachable via status endpoint
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // SonarLink provides a /status endpoint that returns JSON
      // See: https://docs.ceruleansonar.com/c/sonarview/sonarlink
      const response = await fetch(SONARVIEW_STATUS_ENDPOINT, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus('connected');
        return true;
      } else {
        setStatus('error');
        return false;
      }
    } catch {
      // If CORS blocks us, try a no-cors request as fallback
      try {
        await fetch(sonarViewUrl, {
          method: 'HEAD',
          mode: 'no-cors',
        });
        // If we get here, something is running on that port
        setStatus('connected');
        return true;
      } catch {
        setStatus('error');
        return false;
      }
    }
  }, [sonarViewUrl]);

  // Launch SonarView in new tab
  const handleLaunchNewTab = useCallback(async () => {
    const isConnected = await checkConnection();

    if (isConnected) {
      window.open(sonarViewUrl, '_blank', 'noopener,noreferrer');
      setSnackbar({
        open: true,
        message: 'SonarView opened in new tab',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Ensure SonarView application is running in background',
        severity: 'warning',
      });
      // Still open the tab - user might need to start SonarView
      window.open(sonarViewUrl, '_blank', 'noopener,noreferrer');
    }
  }, [checkConnection, sonarViewUrl]);

  // Launch SonarView in embedded modal
  const handleLaunchEmbedded = useCallback(async () => {
    const isConnected = await checkConnection();

    if (isConnected) {
      setShowEmbedded(true);
      setSnackbar({
        open: true,
        message: 'SonarView loaded',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Ensure SonarView application is running in background',
        severity: 'warning',
      });
    }
  }, [checkConnection]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success.main';
      case 'error':
        return 'error.main';
      case 'checking':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Sonar Active';
      case 'error':
        return 'Not Connected';
      case 'checking':
        return 'Checking...';
      default:
        return 'Ready';
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: status === 'connected' ? 'success.main' : 'divider',
          minHeight: 200,
          position: 'relative',
        }}
      >
        {/* Settings button */}
        <Tooltip title="Configure SonarView URL">
          <IconButton
            size="small"
            onClick={() => setShowSettings(true)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Status indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              animation: status === 'checking' ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Typography variant="body2" sx={{ color: getStatusColor(), fontWeight: 500 }}>
            {getStatusText()}
          </Typography>
        </Box>

        <RadarIcon sx={{ fontSize: 48, color: getStatusColor() }} />

        <Typography variant="h6" color="text.primary">
          SonarView
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ maxWidth: 350 }}
        >
          Launch the Cerulean SonarView interface to view sonar imagery from the Omniscan 450 FS.
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant={status === 'connected' ? 'contained' : 'outlined'}
            color={status === 'connected' ? 'success' : 'secondary'}
            startIcon={status === 'checking' ? <CircularProgress size={16} /> : <OpenInNewIcon />}
            onClick={handleLaunchNewTab}
            disabled={status === 'checking'}
          >
            {status === 'connected' ? 'Sonar Active - Open Tab' : 'Launch SonarView'}
          </Button>

          {enableEmbedded && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RadarIcon />}
              onClick={handleLaunchEmbedded}
              disabled={status === 'checking'}
            >
              Open Embedded
            </Button>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Server: {sonarViewUrl}
        </Typography>
      </Box>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogTitle>SonarView Settings</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="SonarView Server URL"
            value={sonarViewUrl}
            onChange={(e) => setSonarViewUrl(e.target.value)}
            placeholder="http://localhost:8000"
            sx={{ mt: 1, minWidth: 300 }}
            helperText="The URL where SonarView web interface is running"
          />
          <Button
            variant="contained"
            onClick={() => {
              setShowSettings(false);
              setStatus('idle');
            }}
            sx={{ mt: 2 }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      {/* Embedded SonarView Modal */}
      <Dialog
        open={showEmbedded}
        onClose={() => setShowEmbedded(false)}
        maxWidth="xl"
        fullWidth
        slotProps={{ paper: { sx: { height: '80vh' } } }}
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          SonarView - Embedded
          <IconButton onClick={() => setShowEmbedded(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <iframe
            src={sonarViewUrl}
            title="SonarView"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </DialogContent>
      </Dialog>

      {/* Toast notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
