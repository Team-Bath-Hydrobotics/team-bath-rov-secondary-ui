import { Paper, Typography } from '@mui/material';
import React from 'react';
/**
 * Telemetry selection controls for the sidebar.
 * Displays checkboxes grouped by category with max 3 selection limit.
 */
interface ToggleLayoutProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactElement;
}
export const ToggleLayout = React.memo(({ children, title, icon }: ToggleLayoutProps) => {
  return (
    <Paper sx={{ borderRadius: '16px', padding: 2 }}>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {icon}
        {title}
      </Typography>
      {children}
    </Paper>
  );
});
