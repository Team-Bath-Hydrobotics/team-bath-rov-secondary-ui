import { Box, IconButton } from '@mui/material';
import SunIcon from '@mui/icons-material/WbSunny';
import MoonIcon from '@mui/icons-material/NightsStay';

interface RenderModeToggleButtonProps {
  darkModeEnabled: boolean;
  onToggle: () => void;
}

export const RenderModeToggleButton = ({
  darkModeEnabled,
  onToggle,
}: RenderModeToggleButtonProps) => {
  return (
    <Box display="flex" justifyContent="flex-end" p={1}>
      <IconButton onClick={onToggle}>
        {darkModeEnabled ? (
          <SunIcon sx={{ color: 'text.primary' }} />
        ) : (
          <MoonIcon sx={{ color: 'text.primary' }} />
        )}
      </IconButton>
    </Box>
  );
};
