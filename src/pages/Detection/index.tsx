import { MainContentLayout } from '../../layouts/MainContentLayout';
import { CircularProgress, Button, Box, Typography } from '@mui/material';
import { DetectorProvider } from '../../context/DetectorContext';
import { useSidebarContent } from '../../hooks/useSidebarContent';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideocamIcon from '@mui/icons-material/Videocam';
import { ToggleLayout } from '../../layouts/ToggleLayout';
import { CameraToggle } from '../../components/Toggles';
import React from 'react';
import { CameraTile } from '../../components/Tiles';
import { DEFAULT_CAMERAS } from '../../types/constants';
import { useAppStateContext } from '../../context';
import { MasonryGrid } from '../../components/MasonryGrid';
import { getDetections, getModel } from '../../api';
import type { ModelResponse } from '../../types/crab-detection.types';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout';

const DetectionContent = () => {
  const { state, detectionCameraConfigs } = useAppStateContext();
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const stableCameraConfigs = useMemo(
    () => detectionCameraConfigs ?? DEFAULT_CAMERAS,
    [detectionCameraConfigs],
  );
  const cameraIsSelected = useMemo(
    () => stableCameraConfigs.some((camera) => state.camerasDetection[camera.id]?.enabled),
    [stableCameraConfigs, state.camerasDetection],
  );

  const detectionApiUrl = state.settings.networkSettings.detectionApiUrl;

  const [model, setModel] = useState<ModelResponse | null>(null);
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    getModel(detectionApiUrl)
      .then(setModel)
      .catch((err) => console.error('[Detection] Failed to load model:', err));
  }, [detectionApiUrl]);

  const handleDetection = useCallback(
    async (frame: string) => {
      setIsDetecting(true);
      try {
        const result = await getDetections(detectionApiUrl, frame);
        setProcessedFrame(result.processed_frame);
      } catch (err) {
        console.error('[Detection] Failed:', err);
      } finally {
        setIsDetecting(false);
      }
    },
    [detectionApiUrl],
  );

  const cameraTiles = useMemo(
    () =>
      stableCameraConfigs
        .filter((camera) => state.camerasDetection[camera.id]?.enabled)
        .map((camera) => {
          const cameraState = state.camerasDetection[camera.id];
          return (
            <CameraTile
              key={camera.id}
              cameraId={camera.id}
              name={camera.name}
              enabled={true}
              isRecording={cameraState?.isRecording ?? false}
              isCopilot={false}
              overlayCanvasRef={overlayCanvasRef}
              handleDetection={handleDetection}
            />
          );
        }),
    [stableCameraConfigs, state.camerasDetection, handleDetection],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, p: 1 }}>
      <MasonryGrid columns={1}>
        {cameraIsSelected ? (
          cameraTiles
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
              overflow: 'hidden',
              p: 2,
            }}
          >
            No cameras enabled. Enable a camera from the sidebar.
          </Box>
        )}
      </MasonryGrid>
      <HorizontalPageContentLayout>
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Detection model: {model ? model.model : 'Loading...'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Api Version: {model ? model.app_version : 'Loading...'}
          </Typography>
        </Box>
        <Button
          disabled={!processedFrame}
          variant="contained"
          onClick={() => setProcessedFrame(null)}
        >
          Clear Detections
        </Button>
      </HorizontalPageContentLayout>
      {isDetecting ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, opacity: 0.8 }}>
            Running detection...
          </Typography>
        </Box>
      ) : processedFrame ? (
        <Box
          sx={{
            padding: 2.5,
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={`data:image/jpeg;base64,${processedFrame}`}
            alt="Processed Frame"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 4,
              backgroundColor: '#000',
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Processed frame will appear here after detection.
        </Box>
      )}
    </Box>
  );
};

const DetectionSidebarNav = React.memo(() => {
  return (
    <>
      <ToggleLayout title="Cameras" icon={<VideocamIcon fontSize="small" />}>
        <CameraToggle isCopilot={false} />
      </ToggleLayout>
    </>
  );
});

export const Detection = () => {
  const sidebarFactory = useCallback(() => <DetectionSidebarNav />, []);

  useSidebarContent(sidebarFactory);
  return (
    <MainContentLayout name="Crab Detection">
      <DetectorProvider>
        <DetectionContent />
      </DetectorProvider>
    </MainContentLayout>
  );
};
