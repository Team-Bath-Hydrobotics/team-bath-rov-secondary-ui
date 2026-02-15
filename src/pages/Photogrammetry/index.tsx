import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Slider,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { TextInput } from '../../components/Inputs/TextInput';
import { FolderUploadComponent } from '../../components/Inputs/FolderUploadComponent';
import { ModelViewer } from '../../components/Tiles';
import type { ReconstructionStatus } from '../../types';
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

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

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
      setJobId(job.id);
      await uploadImages(job.id, uploadedImages);
      await runPhotogrammetry(job.id);
      startPolling(job.id);
    } catch (err) {
      setReconstructionStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to start reconstruction');
    } finally {
      setLoading(false);
    }
  }, [uploadedImages, startPolling]);

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
      setJobId(job.id);
      const result = await generateManualCAD(job.id, estimatedCoralHeight ?? 20, trueCoralLength);
      setModelUrl(result.output_url);
      setReconstructionStatus('complete');
    } catch (err) {
      setReconstructionStatus('error');
      setError(err instanceof Error ? err.message : 'Manual CAD generation failed');
    } finally {
      setLoading(false);
    }
  }, [trueCoralLength, estimatedCoralHeight]);

  const canGenerate =
    uploadedImages.length > 0 &&
    trueCoralLength !== null &&
    trueCoralLength > 0 &&
    reconstructionStatus !== 'processing' &&
    !loading;

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

  const displayText =
    folderPath && uploadedImages.length > 0
      ? `Photo folder selected: ${folderPath} (${uploadedImages.length} images)`
      : 'No folder selected';

  const progressText =
    reconstructionStatus === 'processing' ? `${stage ? `${stage} — ` : ''}${progress}%` : null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.5fr',
        gridTemplateRows: 'auto auto auto auto',
        gap: 1.5,
        padding: 2,
        height: '100%',
      }}
    >
      {/* Row 1, Col 1-2: Upload area */}
      <Box sx={{ gridColumn: '1 / 3', gridRow: '1' }}>
        <FolderUploadComponent
          buttonText="Upload photos"
          displayText={displayText}
          onChange={handleFolderUpload}
        />
      </Box>

      {/* Row 2, Col 1: Estimated Coral Height */}
      <Paper
        elevation={0}
        sx={{
          gridColumn: '1',
          gridRow: '2',
          p: 2,
          borderRadius: '16px',
          backgroundColor: 'background.paper',
        }}
      >
        <TextInput
          label="Estimated Coral Height"
          value={estimatedCoralHeight !== null ? estimatedCoralHeight.toString() : ''}
          onChange={handleCoralHeightChange}
          lowerText="(cm)"
        />
      </Paper>

      {/* Row 2, Col 2: True Coral Length */}
      <Paper
        elevation={0}
        sx={{
          gridColumn: '2',
          gridRow: '2',
          p: 2,
          borderRadius: '16px',
          backgroundColor: 'background.paper',
        }}
      >
        <TextInput
          label="True Coral Length"
          value={trueCoralLength !== null ? trueCoralLength.toString() : ''}
          onChange={handleCoralLengthChange}
          lowerText="(cm)"
        />
      </Paper>

      {/* Row 3, Col 1: Generate Model button */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleGenerate}
        disabled={!canGenerate}
        sx={{
          gridColumn: '1',
          gridRow: '3',
          borderRadius: '16px',
          fontSize: '1.25rem',
          fontWeight: 700,
          textTransform: 'none',
          minHeight: 80,
        }}
      >
        {loading && reconstructionStatus === 'processing' ? (
          <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
        ) : null}
        {reconstructionStatus === 'processing' ? 'Generating...' : 'Generate model'}
      </Button>

      {/* Row 3, Col 2: Scale Model slider + Scale button */}
      <Paper
        elevation={0}
        sx={{
          gridColumn: '2',
          gridRow: '3',
          p: 2,
          borderRadius: '16px',
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
          color="secondary"
          size="small"
          onClick={handleScale}
          disabled={!canScale}
          sx={{ mt: 1, textTransform: 'none', borderRadius: '8px' }}
        >
          {loading && canScale ? (
            <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          ) : null}
          Estimate Height
        </Button>
      </Paper>

      {/* Row 4, Col 1: Manual CAD button */}
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleManualCAD}
        disabled={!canManualCAD}
        sx={{
          gridColumn: '1',
          gridRow: '4',
          borderRadius: '16px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          minHeight: 60,
        }}
      >
        {loading && reconstructionStatus === 'processing' && !canGenerate ? (
          <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
        ) : null}
        Manual CAD Model
      </Button>

      {/* Row 4, Col 2: Progress display */}
      {progressText && (
        <Paper
          elevation={0}
          sx={{
            gridColumn: '2',
            gridRow: '4',
            p: 2,
            borderRadius: '16px',
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

      {/* Row 1-4, Col 3: 3D Model Viewer */}
      <Paper
        elevation={0}
        sx={{
          gridColumn: '3',
          gridRow: '1 / -1',
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

      {/* Error snackbar */}
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
