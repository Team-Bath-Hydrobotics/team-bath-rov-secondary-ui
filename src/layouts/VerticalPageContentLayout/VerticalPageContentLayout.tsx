import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface VerticalPageContentLayoutProps {
  children: ReactNode;
}

export default function VerticalPageContentLayout({ children }: VerticalPageContentLayoutProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        backgroundColor: 'green',
      }}
    >
      {children}
    </Box>
  );
}
