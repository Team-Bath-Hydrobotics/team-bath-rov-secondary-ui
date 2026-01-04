import { Children, useMemo, type ReactNode } from 'react';
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
  columns = { xs: 1, sm: 2, md: 3 },
  spacing = 1,
}: MasonryGridProps) => {
  const validChildren = useMemo(() => Children.toArray(children), [children]);

  return (
    <Box sx={{ flex: 1, height: 800, display: 'flex', flexDirection: 'column', padding: 2 }}>
      <Masonry columns={columns} spacing={spacing}>
        {validChildren}
      </Masonry>
    </Box>
  );
};
