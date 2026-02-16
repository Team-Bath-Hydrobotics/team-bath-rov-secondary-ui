import { Box, Button } from '@mui/material';
import { useState, useMemo } from 'react';
import { ImageTile } from '../Tiles/ImageTile';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export interface CarouselProps {
  images: File[];
}

export const Carousel = ({ images }: CarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Generate object URLs
  const imageUrls = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file));
  }, [images]);

  // Cleanup URLs when images change or component unmounts
  useMemo(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  return (
    <Box>
      {images.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>No images to display</Box>
      ) : (
        <HorizontalPageContentLayout>
          <Button
            onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}
            sx={{ width: '50%', color: 'primary.light' }}
          >
            <KeyboardArrowLeftIcon />
          </Button>

          <ImageTile imagefile={imageUrls[activeIndex]} altTitle="Image not found" />

          <Button
            onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
            sx={{ width: '50%', color: 'primary.light' }}
          >
            <KeyboardArrowRightIcon />
          </Button>
        </HorizontalPageContentLayout>
      )}
    </Box>
  );
};
