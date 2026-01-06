import { Box, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface SidebarToggleButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const SidebarToggleButton = ({ collapsed, onToggle }: SidebarToggleButtonProps) => {
  return (
    <Box display="flex" justifyContent="flex-end" p={1}>
      <Typography variant="h3" sx={{ flexGrow: 1, color: 'text.secondary', alignSelf: 'center' }}>
        TBH
      </Typography>
      <IconButton onClick={onToggle} sx={{ color: 'text.primary' }}>
        {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
      </IconButton>
    </Box>
  );
};
