import { useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import RadarIcon from '@mui/icons-material/Radar';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// SonarView Docker container serves web UI on port 7077
// See: https://docs.ceruleansonar.com/c/sonarview/installation/docker
const SONARVIEW_URL = 'http://localhost:7077';

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error';

/**
 * SonarView integration component.
 *
 * Connects to SonarView running as a Docker container.
 * The Docker version exposes a web UI at localhost:7077 that can be
 * opened in a new tab or embedded in an iframe.
 *
 * macOS/Windows Setup:
 * docker run -d -v ~/SonarView:/userdata -p 7077:7077 --name=sonarview --restart=unless-stopped nicknothom/sonarview:1.13.15
 *
 * Linux Setup:
 * docker run -d -v /usr/SonarView:/userdata --net=host --name=sonarview --restart=unless-stopped nicknothom/sonarview:1.13.15
 */
export const SonarPlaceholder = () => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Check if SonarView Docker container is running
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(SONARVIEW_URL, {
        method: 'HEAD',
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
      setStatus('error');
      return false;
    }
  }, []);

  // Check on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkConnection();
    }, 100);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open SonarView in new browser tab
  const handleOpenNewTab = useCallback(async () => {
    const isConnected = await checkConnection();

    if (isConnected) {
      window.open(SONARVIEW_URL, '_blank', 'noopener,noreferrer');
      setSnackbar({
        open: true,
        message: 'SonarView opened in new tab',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'SonarView not running. Start Docker container first.',
        severity: 'warning',
      });
    }
  }, [checkConnection]);

  // Open SonarView embedded in modal
  const handleOpenEmbedded = useCallback(async () => {
    const isConnected = await checkConnection();

    if (isConnected) {
      setShowEmbedded(true);
    } else {
      setSnackbar({
        open: true,
        message: 'SonarView not running. Start Docker container first.',
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
        return 'SonarView Running';
      case 'error':
        return 'Not Running';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
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
          p: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          border: '2px solid',
          borderColor: status === 'connected' ? 'success.main' : 'divider',
        }}
      >
        {/* Status indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {status === 'checking' ? (
            <CircularProgress size={20} color="warning" />
          ) : status === 'connected' ? (
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
          ) : status === 'error' ? (
            <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 24 }} />
          ) : (
            <RadarIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
          )}
          <Typography variant="h6" sx={{ color: getStatusColor(), fontWeight: 600 }}>
            {getStatusText()}
          </Typography>
        </Box>

        <RadarIcon sx={{ fontSize: 48, color: getStatusColor() }} />

        <Typography variant="h5" color="text.primary" fontWeight={600}>
          SonarView
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ maxWidth: 350 }}
        >
          {status === 'connected'
            ? 'SonarView is running. Open it in a new tab or embed it below.'
            : 'Start the SonarView Docker container to view sonar imagery.'}
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<RefreshIcon />}
            onClick={() => checkConnection()}
            disabled={status === 'checking'}
            size="small"
          >
            Refresh
          </Button>

          <Button
            variant={status === 'connected' ? 'contained' : 'outlined'}
            color={status === 'connected' ? 'success' : 'secondary'}
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenNewTab}
            disabled={status === 'checking'}
          >
            Open in New Tab
          </Button>

          <Button
            variant={status === 'connected' ? 'contained' : 'outlined'}
            color={status === 'connected' ? 'secondary' : 'inherit'}
            startIcon={<FullscreenIcon />}
            onClick={handleOpenEmbedded}
            disabled={status === 'checking' || status !== 'connected'}
          >
            Embed Here
          </Button>
        </Box>

        {/* Docker instructions when not connected */}
        {status === 'error' && (
          <Box
            sx={{
              mt: 1,
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 1,
              width: '100%',
              maxWidth: 450,
            }}
          >
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Start SonarView Docker container:</strong>
              <Box
                component="code"
                sx={{
                  display: 'block',
                  mt: 1,
                  p: 1,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                }}
              >
                try docker run -d --net=host --name=sonarview nicknothom/sonarview:latest or docker
                run -d -v ~/SonarView:/userdata -p 7077:7077 --name=sonarview
                --restart=unless-stopped nicknothom/sonarview:1.13.15
              </Box>
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary">
          {SONARVIEW_URL}
        </Typography>
      </Box>

      {/* Embedded SonarView Modal */}
      <Dialog
        open={showEmbedded}
        onClose={() => setShowEmbedded(false)}
        maxWidth={false}
        fullWidth
        slotProps={{
          paper: {
            sx: {
              width: '95vw',
              height: '90vh',
              maxWidth: '95vw',
              m: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RadarIcon color="success" />
            <Typography variant="h6">SonarView - Embedded</Typography>
          </Box>
          <Box>
            <Button
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(SONARVIEW_URL, '_blank')}
              sx={{ mr: 1 }}
            >
              Pop Out
            </Button>
            <IconButton onClick={() => setShowEmbedded(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <iframe
            src={SONARVIEW_URL}
            title="SonarView"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#1a1a2e',
            }}
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
