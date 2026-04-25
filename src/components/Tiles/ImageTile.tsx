import { Paper, Box } from '@mui/material';
import { useEffect, useMemo, useRef, useCallback } from 'react';

interface ImageTileProps {
  imagefile: File | string;
  altTitle: string;
  onDimensionsChange?: (width: number, height: number) => void;
}

export const ImageTile = ({ imagefile, altTitle, onDimensionsChange }: ImageTileProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const prevDimensions = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const imageUrl = useMemo(() => {
    if (typeof imagefile === 'string') return imagefile; // already a URL
    if (imagefile.size === 0) return ''; // empty File
    return URL.createObjectURL(imagefile); // create URL for File
  }, [imagefile]);

  useEffect(() => {
    if (typeof imagefile !== 'string' && imageUrl) {
      return () => URL.revokeObjectURL(imageUrl); // cleanup only for File URLs
    }
  }, [imagefile, imageUrl]);

  const reportDimensions = useCallback(() => {
    if (imgRef.current && onDimensionsChange) {
      const { width, height } = imgRef.current.getBoundingClientRect();
      // Only report if dimensions have actually changed
      if (width !== prevDimensions.current.width || height !== prevDimensions.current.height) {
        prevDimensions.current = { width, height };
        onDimensionsChange(width, height);
      }
    }
  }, [onDimensionsChange]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new ResizeObserver(reportDimensions);
    observer.observe(img);
    return () => observer.disconnect();
  }, [reportDimensions]);

  if (!imageUrl) {
    return (
      <Paper elevation={2} sx={{ position: 'relative', minWidth: 350, overflow: 'hidden' }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
            color: 'text.secondary',
          }}
        >
          {altTitle}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        minWidth: 250,
        overflow: 'hidden',
      }}
    >
      <Box>
        <img
          ref={imgRef}
          onLoad={reportDimensions}
          src={imageUrl}
          alt={altTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover', minWidth: '350px' }}
        />
      </Box>
    </Paper>
  );
};
