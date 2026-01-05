import { Paper, Box, Typography } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface TelemetryTileProps {
  /** Telemetry field identifier */
  fieldId: string;
  /** Display label (e.g., "Depth", "Roll") */
  label: string;
  /** Unit of measurement (e.g., "m", "°C") */
  unit: string;
  /** Whether this telemetry is currently selected for display */
  selected: boolean;
}

/**
 * Telemetry tile displaying a placeholder for the graph.
 * Shows greyed-out state when not selected.
 */
export const TelemetryTile = ({ label, unit, selected }: TelemetryTileProps) => {
  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        minHeight: 150,
        overflow: 'hidden',
        // Greyed-out effect when not selected
        opacity: selected ? 1 : 0.5,
        backgroundColor: selected ? 'background.paper' : 'grey.200',
        transition: 'opacity 0.3s, background-color 0.3s',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 2,
        }}
      >
        <ShowChartIcon sx={{ fontSize: 36, color: selected ? 'primary.main' : 'grey.400' }} />
        <Typography
          variant="subtitle1"
          fontWeight={500}
          color={selected ? 'text.primary' : 'grey.500'}
        >
          {label}
        </Typography>
        {unit && (
          <Typography variant="caption" color={selected ? 'text.secondary' : 'grey.400'}>
            ({unit})
          </Typography>
        )}
        {!selected && (
          <Typography variant="caption" color="grey.500" sx={{ mt: 1 }}>
            Not selected
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
