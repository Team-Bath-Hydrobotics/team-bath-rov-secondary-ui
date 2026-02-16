import { Paper, Box } from '@mui/material';
import { useEffect, useMemo } from 'react';

interface ImageTileProps {
  imagefile: File | string;
  altTitle: string;
}

export const ImageTile = ({ imagefile, altTitle }: ImageTileProps) => {
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

  if (!imageUrl) {
    return (
      <Paper
        elevation={2}
        sx={{ position: 'relative', minWidth: 350, aspectRatio: '16/9', overflow: 'hidden' }}
      >
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
        minWidth: 350,
        aspectRatio: '16/9',
        overflow: 'hidden',
      }}
    >
      <Box>
        <img
          src={imageUrl}
          alt={altTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover', minWidth: '350px' }}
        />
      </Box>
    </Paper>
  );
};
