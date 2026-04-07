import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Slider,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BuildIcon from '@mui/icons-material/Build';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { TextInput } from '../../components/Inputs/TextInput';
import { UploadComponent } from '../../components/Inputs';
import { ModelViewer } from '../../components/Tiles';
import type { ReconstructionStatus } from '../../types';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { Carousel } from '../../components/Carousel/Carousel';
import {
  createJob,
  uploadImages,
  runPhotogrammetry,
  getJob,
  estimateScale,
  generateManualCAD,
  getModelUrl,
} from '../../api';

const POLL_INTERVAL_MS = 2000;
const STORAGE_KEY = 'photogrammetry_job_id';

type Mode = 'photogrammetry' | 'manual-cad';

const PhotogrammetryContent = () => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [folderPath, setFolderPath] = useState('');
  const [estimatedCoralHeight, setEstimatedCoralHeight] = useState<number | null>(null);
  const [trueCoralLength, setTrueCoralLength] = useState<number | null>(null);
  const [modelScale, setModelScale] = useState(1.0);
  const [reconstructionStatus, setReconstructionStatus] = useState<ReconstructionStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('photogrammetry');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const job = await getJob(id);
          setProgress(job.progress);
          setStage(job.stage);

          if (job.status === 'complete') {
            stopPolling();
            setReconstructionStatus('complete');
            setModelUrl(getModelUrl(id));
            if (job.estimated_height_cm !== null) {
              setEstimatedCoralHeight(job.estimated_height_cm);
            }
          } else if (job.status === 'error') {
            stopPolling();
            setReconstructionStatus('error');
            setError(job.error ?? 'Reconstruction failed');
          }
        } catch (err) {
          stopPolling();
          setReconstructionStatus('error');
          setError(err instanceof Error ? err.message : 'Polling failed');
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  // Restore persisted job on mount
  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);
    if (!savedJobId) return;

    let cancelled = false;

    const restoreJob = async () => {
      try {
        const job = await getJob(savedJobId);
        if (cancelled) return;

        setJobId(savedJobId);

        if (job.status === 'complete') {
          setReconstructionStatus('complete');
          setModelUrl(getModelUrl(savedJobId));
          if (job.estimated_height_cm !== null) {
            setEstimatedCoralHeight(job.estimated_height_cm);
          }
        } else if (job.status === 'error') {
          setReconstructionStatus('error');
          setError(job.error ?? 'Previous job failed');
        } else {
          // Job still running — resume polling
          setReconstructionStatus('processing');
          setProgress(job.progress);
          setStage(job.stage);
          startPolling(savedJobId);
        }
      } catch {
        // Job not found on backend — clear stale reference
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    restoreJob();

    return () => {
      cancelled = true;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  const persistJobId = useCallback((id: string) => {
    setJobId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const handleFolderUpload = useCallback((files: File[]) => {
    setUploadedImages(files);
    if (files.length > 0 && files[0].webkitRelativePath) {
      const parts = files[0].webkitRelativePath.split('/');
      setFolderPath(parts.slice(0, -1).join('/'));
    } else {
      setFolderPath('');
    }
    setReconstructionStatus('idle');
    setModelUrl(null);
    setJobId(null);
    setProgress(0);
    setStage(null);
  }, []);

  const handleCoralHeightChange = useCallback((value: string) => {
    if (value === '') {
      setEstimatedCoralHeight(null);
      return;
    }
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEstimatedCoralHeight(numValue);
    }
  }, []);

  const handleCoralLengthChange = useCallback((value: string) => {
    if (value === '') {
      setTrueCoralLength(null);
      return;
    }
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setTrueCoralLength(numValue);
    }
  }, []);

  const handleScaleChange = useCallback((_event: Event, value: number | number[]) => {
    setModelScale(value as number);
  }, []);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReconstructionStatus('processing');
    setProgress(0);
    setStage(null);
    setModelUrl(null);

    try {
      const job = await createJob();
      persistJobId(job.id);
      await uploadImages(job.id, uploadedImages);
      await runPhotogrammetry(job.id);
      startPolling(job.id);
    } catch (err) {
      setReconstructionStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to start reconstruction');
    } finally {
      setLoading(false);
    }
  }, [uploadedImages, startPolling, persistJobId]);

  const handleRetryWithoutUndistort = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    setReconstructionStatus('processing');
    setProgress(0);
    setStage(null);
    setModelUrl(null);

    try {
      await runPhotogrammetry(jobId, { skipUndistort: true });
      startPolling(jobId);
    } catch (err) {
      setReconstructionStatus('error');
      setError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setLoading(false);
    }
  }, [jobId, startPolling]);

  const handleScale = useCallback(async () => {
    if (!jobId || trueCoralLength === null) return;
    setLoading(true);
    setError(null);

    try {
      const result = await estimateScale(jobId, trueCoralLength);
      setEstimatedCoralHeight(result.estimated_height_cm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scaling failed');
    } finally {
      setLoading(false);
    }
  }, [jobId, trueCoralLength]);

  const handleManualCAD = useCallback(async () => {
    if (trueCoralLength === null) return;
    setLoading(true);
    setError(null);
    setReconstructionStatus('processing');

    try {
      const job = await createJob();
      persistJobId(job.id);
      const result = await generateManualCAD(job.id, estimatedCoralHeight ?? 20, trueCoralLength);
      setModelUrl(result.output_url);
      setReconstructionStatus('complete');
    } catch (err) {
      setReconstructionStatus('error');
      setError(err instanceof Error ? err.message : 'Manual CAD generation failed');
    } finally {
      setLoading(false);
    }
  }, [trueCoralLength, estimatedCoralHeight, persistJobId]);

  const handleModeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newMode: Mode | null) => {
      if (newMode !== null) {
        setMode(newMode);
      }
    },
    [],
  );

  const handleNewJob = useCallback(() => {
    stopPolling();
    localStorage.removeItem(STORAGE_KEY);
    setJobId(null);
    setModelUrl(null);
    setReconstructionStatus('idle');
    setProgress(0);
    setStage(null);
    setError(null);
  }, [stopPolling]);

  const canGenerate =
    uploadedImages.length > 0 && reconstructionStatus !== 'processing' && !loading;

  const canScale =
    jobId !== null &&
    reconstructionStatus === 'complete' &&
    trueCoralLength !== null &&
    trueCoralLength > 0 &&
    !loading;

  const canManualCAD =
    trueCoralLength !== null &&
    trueCoralLength > 0 &&
    reconstructionStatus !== 'processing' &&
    !loading;

  const canRetry = jobId !== null && reconstructionStatus === 'error' && !loading;

  const displayText =
    folderPath && uploadedImages.length > 0
      ? `Photo folder selected: ${folderPath} (${uploadedImages.length} images)`
      : 'No folder selected';

  const progressText =
    reconstructionStatus === 'processing' ? `${stage ? `${stage} — ` : ''}${progress}%` : null;

  return (
    <Box
      sx={{
        padding: 2,
      }}
    >
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            sx={{ width: '100%' }}
          >
            <ToggleButton
              value="photogrammetry"
              sx={{ flex: 1, textTransform: 'none', color: 'text.secondary' }}
            >
              <CameraAltIcon sx={{ mr: 1 }} />
              Photogrammetry
            </ToggleButton>
            <ToggleButton
              value="manual-cad"
              sx={{ flex: 1, textTransform: 'none', color: 'text.secondary' }}
            >
              <BuildIcon sx={{ mr: 1 }} />
              Manual CAD
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === 'photogrammetry' && (
            <>
              <UploadComponent
                buttonText="Upload Photo Folder"
                displayText={displayText}
                directory
                filterImages
                onChange={(files) => handleFolderUpload(files)}
              />
              <Carousel images={uploadedImages} />
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!canGenerate}
                sx={{
                  color: 'primary.light',
                  width: '100%',
                  '&:disabled': {
                    backgroundColor: 'grey.500',
                    opacity: 0.4,
                    color: 'white',
                  },
                }}
              >
                {loading && reconstructionStatus === 'processing' ? (
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                {reconstructionStatus === 'processing' ? 'Generating...' : 'Generate Model'}
              </Button>

              {canRetry && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleRetryWithoutUndistort}
                  sx={{ width: '100%', textTransform: 'none' }}
                >
                  Retry Without Undistortion
                </Button>
              )}
            </>
          )}

          {mode === 'manual-cad' && (
            <Button
              variant="contained"
              onClick={handleManualCAD}
              disabled={!canManualCAD}
              sx={{
                width: '100%',
                '&:disabled': {
                  backgroundColor: 'grey.500',
                  opacity: 0.4,
                  color: 'white',
                },
              }}
            >
              {loading && reconstructionStatus === 'processing' ? (
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              ) : null}
              Generate Manual CAD Model
            </Button>
          )}

          {/* Shared controls: inputs, scaling + progress */}
          <HorizontalPageContentLayout>
            <TextInput
              label="Estimated Coral Height"
              value={estimatedCoralHeight !== null ? estimatedCoralHeight.toString() : ''}
              onChange={handleCoralHeightChange}
              lowerText={mode === 'manual-cad' ? '(cm) — defaults to 20cm if empty' : '(cm)'}
            />
            <TextInput
              label="True Coral Length"
              value={trueCoralLength !== null ? trueCoralLength.toString() : ''}
              onChange={handleCoralLengthChange}
              lowerText="(cm)"
            />
          </HorizontalPageContentLayout>
          <HorizontalPageContentLayout>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Scale Model
              </Typography>
              <Slider
                value={modelScale}
                onChange={handleScaleChange}
                min={0.1}
                max={5.0}
                step={0.1}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v.toFixed(1)}x`}
                sx={{
                  color: 'secondary.main',
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: 'secondary.main',
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleScale}
                disabled={!canScale}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  color: 'grey.300',
                  borderColor: 'grey.400',
                  '&.Mui-disabled': {
                    color: 'grey.500',
                    borderColor: 'grey.600',
                  },
                }}
              >
                {loading && canScale ? (
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                Estimate Height
              </Button>
            </Paper>

            {progressText && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <CircularProgress size={20} color="warning" />
                <Typography variant="body2" color="text.secondary">
                  {progressText}
                </Typography>
              </Paper>
            )}
          </HorizontalPageContentLayout>

          {(reconstructionStatus === 'complete' || reconstructionStatus === 'error') && (
            <Button
              variant="text"
              size="small"
              onClick={handleNewJob}
              sx={{ textTransform: 'none' }}
            >
              Start New Job
            </Button>
          )}
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <Paper
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: 'rgba(128, 128, 128, 0.15)',
              overflow: 'hidden',
            }}
          >
            <ModelViewer
              modelUrl={modelUrl}
              status={reconstructionStatus}
              estimatedHeight={estimatedCoralHeight}
            />
          </Paper>
        </VerticalPageContentLayout>
      </HorizontalPageContentLayout>

      <Snackbar open={error !== null} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export const Photogrammetry = () => {
  return (
    <MainContentLayout name="Photogrammetry Interface">
      <PhotogrammetryContent />
    </MainContentLayout>
  );
};
