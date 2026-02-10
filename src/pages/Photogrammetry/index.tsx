import { useState, useCallback } from 'react';
import { Box, Button, Paper, Slider, Typography } from '@mui/material';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { TextInput } from '../../components/Inputs/TextInput';
import { FolderUploadComponent } from '../../components/Inputs/FolderUploadComponent';
import { ModelViewerPlaceholder } from '../../components/Tiles/ModelViewerPlaceholder';
import type { ReconstructionStatus } from '../../types';

const PhotogrammetryContent = () => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [folderPath, setFolderPath] = useState('');
  const [estimatedCoralHeight, setEstimatedCoralHeight] = useState<number | null>(null);
  const [trueCoralLength, setTrueCoralLength] = useState<number | null>(null);
  const [modelScale, setModelScale] = useState(1.0);
  const [reconstructionStatus, setReconstructionStatus] = useState<ReconstructionStatus>('idle');

  const handleFolderUpload = useCallback((files: File[]) => {
    setUploadedImages(files);
    if (files.length > 0 && files[0].webkitRelativePath) {
      const parts = files[0].webkitRelativePath.split('/');
      setFolderPath(parts.slice(0, -1).join('/'));
    } else {
      setFolderPath('');
    }
    setReconstructionStatus('idle');
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

  const handleGenerate = useCallback(() => {
    setReconstructionStatus('processing');
    // Placeholder: real reconstruction logic will be added later
    setTimeout(() => setReconstructionStatus('complete'), 2000);
  }, []);

  const canGenerate =
    uploadedImages.length > 0 &&
    trueCoralLength !== null &&
    trueCoralLength > 0 &&
    reconstructionStatus !== 'processing';

  const displayText =
    folderPath && uploadedImages.length > 0
      ? `Photo folder selected: ${folderPath} (${uploadedImages.length} images)`
      : 'No folder selected';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.5fr',
        gridTemplateRows: 'auto auto auto',
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
        {reconstructionStatus === 'processing' ? 'Generating...' : 'Generate model'}
      </Button>

      {/* Row 3, Col 2: Scale Model slider */}
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
      </Paper>

      {/* Row 1-3, Col 3: 3D Model Viewer */}
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
        <ModelViewerPlaceholder
          status={reconstructionStatus}
          estimatedHeight={estimatedCoralHeight}
        />
      </Paper>
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
