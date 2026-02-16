import { useState, useCallback } from 'react';
import { Box, Button, Paper, Slider, Typography } from '@mui/material';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { TextInput } from '../../components/Inputs/TextInput';
import { UploadComponent } from '../../components/Inputs';
import { ModelViewerPlaceholder } from '../../components/Tiles/ModelViewerPlaceholder';
import type { ReconstructionStatus } from '../../types';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { Carousel } from '../../components/Carousel/Carousel';
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
        padding: 2,
      }}
    >
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <UploadComponent
            buttonText="Upload Photo Folder"
            displayText={displayText}
            directory
            filterImages
            onChange={(files) => handleFolderUpload(files)}
          />
          <Carousel images={uploadedImages} />
          <HorizontalPageContentLayout>
            <TextInput
              label="Estimated Coral Height"
              value={estimatedCoralHeight !== null ? estimatedCoralHeight.toString() : ''}
              onChange={handleCoralHeightChange}
              lowerText="(cm)"
            />
            <TextInput
              label="True Coral Length"
              value={trueCoralLength !== null ? trueCoralLength.toString() : ''}
              onChange={handleCoralLengthChange}
              lowerText="(cm)"
            />
          </HorizontalPageContentLayout>
          <HorizontalPageContentLayout>
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
              {reconstructionStatus === 'processing' ? 'Generating...' : 'Generate model'}
            </Button>

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
            </Paper>
          </HorizontalPageContentLayout>
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          {/* Row 1-3, Col 3: 3D Model Viewer */}
          <Paper
            elevation={0}
            sx={{
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
        </VerticalPageContentLayout>
      </HorizontalPageContentLayout>
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
