import { type ReactNode } from 'react';
import { Box } from '@mui/material';
import Masonry from '@mui/lab/Masonry';

interface MasonryGridProps {
  children: ReactNode;
  /** Number of columns at different breakpoints */
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap between items in theme spacing units (default: 2 = 16px) */
  spacing?: number;
}

/**
 * Masonry layout wrapper for camera and telemetry tiles.
 * Items fill vertical gaps rather than aligning to a strict grid.
 */
export const MasonryGrid = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  spacing = 2,
}: MasonryGridProps) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Masonry columns={columns} spacing={spacing}>
        {children}
      </Masonry>
    </Box>
  );
};
