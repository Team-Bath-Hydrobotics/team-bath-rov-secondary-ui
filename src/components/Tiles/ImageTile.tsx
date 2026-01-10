import { Paper, Box } from '@mui/material';
import { useEffect, useMemo } from 'react';

interface ImageTileProps {
  imagefile: File;
  altTitle: string;
}

export const ImageTile = ({ imagefile, altTitle }: ImageTileProps) => {
  const imageUrl = useMemo(() => {
    if (imagefile.size === 0) return '';
    return URL.createObjectURL(imagefile);
  }, [imagefile]);

  useEffect(() => {
    if (imageUrl) {
      return () => URL.revokeObjectURL(imageUrl);
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return null;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        minWidth: 150,
        minHeight: 250,
        aspectRatio: '16/9',
        overflow: 'hidden',
      }}
    >
      <Box>
        <img
          src={imageUrl}
          alt={altTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>
    </Paper>
  );
};
