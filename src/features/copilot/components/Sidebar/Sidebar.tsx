import { Drawer, Box, IconButton, Divider } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useCoPilot } from '../../context';
import { CameraControls } from './CameraControls';
import { TelemetryControls } from './TelemetryControls';

const DRAWER_WIDTH = 280;

/**
 * Collapsible sidebar containing camera and telemetry controls.
 */
export const Sidebar = () => {
  const { state, setSidebarOpen } = useCoPilot();
  const { sidebarOpen } = state;

  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <IconButton
          onClick={() => setSidebarOpen(true)}
          sx={{
            position: 'fixed',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1200,
            backgroundColor: 'background.paper',
            boxShadow: 1,
            '&:hover': { backgroundColor: 'grey.100' },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      )}

      {/* The drawer itself */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Header with close button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={() => setSidebarOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Controls */}
        <Box sx={{ p: 2, overflowY: 'auto' }}>
          <CameraControls />

          <Divider sx={{ my: 2 }} />

          <TelemetryControls />
        </Box>
      </Drawer>
    </>
  );
};
