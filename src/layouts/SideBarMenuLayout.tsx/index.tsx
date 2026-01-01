import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';
import Typography from '@mui/material/Typography';

interface SidebarMenuLayoutProps {
  children: ReactNode
}

export default function SideBarMenuLayout({children}: SidebarMenuLayoutProps) {
  return (
    <Paper sx={{ borderRadius: '16px'}}>
        <Typography variant="h4" sx={{ p: 2 }}>Interface</Typography>
      {children}
    </Paper>
  );
}
