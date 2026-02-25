import { Box, List, ListItemButton, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BiotechIcon from '@mui/icons-material/Biotech';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import WaterIcon from '@mui/icons-material/Water';
import type { ReactElement } from 'react';

interface VerticalNavProps {
  collapsed: boolean;
}

export function VerticalNav({ collapsed }: VerticalNavProps) {
  const pages = [
    { key: 'copilot', label: 'CoPilot', icon: 'pilot' },
    { key: 'telemetry', label: 'Telemetry', icon: 'telemetry' },
    { key: 'detection', label: 'Crab Detection', icon: 'detection' },
    { key: 'edna', label: 'EDna', icon: 'edna' },
    { key: 'iceberg-threat', label: 'Iceberg Threat', icon: 'iceberg-threat' },
    { key: 'photogrammetry', label: 'Photogrammetry', icon: 'photogrammetry' },
    { key: 'float', label: 'Float', icon: 'float' },
  ];
  const iconMap: Record<string, ReactElement> = {
    pilot: <SportsEsportsIcon />,
    telemetry: <TrendingUpIcon />,
    detection: <VisibilityIcon />,
    edna: <BiotechIcon />,
    'iceberg-threat': <AcUnitIcon />,
    photogrammetry: <CameraAltIcon />,
    float: <WaterIcon />,
  };

  return (
    <List sx={{ pl: 1, pr: 1 }}>
      {pages.map(({ key, label, icon }) => (
        <ListItemButton
          key={key}
          component={NavLink}
          to={`/${key}`}
          sx={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '16px',
            '&.active': {
              backgroundColor: (theme) => theme.palette.secondary.main,
              color: (theme) => theme.palette.primary.contrastText,
            },
          }}
        >
          {collapsed ? (
            iconMap[icon]
          ) : (
            <Box display="flex" alignItems="center" gap={2}>
              {iconMap[icon]}
              <ListItemText primary={label} sx={{ typography: 'body1' }} />
            </Box>
          )}
        </ListItemButton>
      ))}
    </List>
  );
}
