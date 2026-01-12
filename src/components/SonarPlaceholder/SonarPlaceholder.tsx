import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import RadarIcon from '@mui/icons-material/Radar';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// SonarLink API runs on port 7077 - see https://docs.ceruleansonar.com/c/sonarview/sonarlink
// Note: SonarView UI is an Electron app - it cannot be opened in a browser
const SONARVIEW_STATUS_ENDPOINT = 'http://localhost:7077/status';
const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds when monitoring

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error';

/**
 * SonarView status monitor component.
 *
 * SonarView is an Electron desktop app (not a web page).
 * This component monitors if SonarView is running via the SonarLink API
 * and displays the connection status to help the co-pilot.
 */
export const SonarPlaceholder = () => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Check if SonarView/SonarLink is running via status endpoint
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // SonarLink provides a /status endpoint
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
      // If fetch fails (CORS, network error, etc.), try no-cors as fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch(SONARVIEW_STATUS_ENDPOINT, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        // If we get here without throwing, something is running on that port
        setStatus('connected');
        return true;
      } catch {
        setStatus('error');
        return false;
      }
    }
  }, []);

  // Manual check button handler
  const handleCheckStatus = useCallback(async () => {
    const isConnected = await checkConnection();

    if (isConnected) {
      setSnackbar({
        open: true,
        message: 'SonarView is running! Use the desktop app window.',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'SonarView not detected. Please launch the SonarView application.',
        severity: 'warning',
      });
    }
  }, [checkConnection]);

  // Toggle continuous monitoring
  const handleToggleMonitoring = useCallback(() => {
    setIsMonitoring((prev) => !prev);
  }, []);

  // Check on mount
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      checkConnection();
    }, 100);

    return () => clearTimeout(timeoutId);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Continuous monitoring when enabled
  useEffect(() => {
    if (!isMonitoring) return;

    // Set up interval for continuous monitoring
    const intervalId = setInterval(() => {
      checkConnection();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isMonitoring, checkConnection]);

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
        return 'Not Detected';
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
          p: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          border: '2px solid',
          borderColor: status === 'connected' ? 'success.main' : 'divider',
          minHeight: 220,
        }}
      >
        {/* Status indicator with icon */}
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

        <RadarIcon sx={{ fontSize: 56, color: getStatusColor() }} />

        <Typography variant="h5" color="text.primary" fontWeight={600}>
          SonarView
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ maxWidth: 380 }}
        >
          SonarView is a <strong>desktop application</strong> - open it directly from your
          applications folder. This panel monitors if it&apos;s running.
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
          <Button
            variant={status === 'connected' ? 'contained' : 'outlined'}
            color={status === 'connected' ? 'success' : 'secondary'}
            startIcon={status === 'checking' ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleCheckStatus}
            disabled={status === 'checking'}
          >
            Check Status
          </Button>

          <Button
            variant={isMonitoring ? 'contained' : 'outlined'}
            color={isMonitoring ? 'warning' : 'inherit'}
            onClick={handleToggleMonitoring}
            size="small"
          >
            {isMonitoring ? 'Stop Monitoring' : 'Auto-Monitor'}
          </Button>
        </Box>

        {/* Instructions */}
        <Box
          sx={{
            mt: 1,
            p: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 1,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography variant="caption" color="text.secondary" component="div">
            <strong>To use SonarView:</strong>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>Open SonarView from Applications</li>
              <li>Connect Omniscan 450 FS via Ethernet</li>
              <li>Configure session in SonarView</li>
            </ol>
          </Typography>
        </Box>

        {isMonitoring && (
          <Typography variant="caption" color="warning.main">
            Auto-checking every 5 seconds...
          </Typography>
        )}
      </Box>

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
