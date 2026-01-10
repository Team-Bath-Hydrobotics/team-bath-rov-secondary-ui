import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface HorizontalPageContentLayoutProps {
  children: ReactNode;
}

export default function HorizontalPageContentLayout({
  children,
}: HorizontalPageContentLayoutProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 1,
        backgroundColor: 'yellow',
        '& > *': {
          flex: '1 1 0',
          minWidth: '300px',
        },
      }}
    >
      {children}
    </Box>
  );
}
