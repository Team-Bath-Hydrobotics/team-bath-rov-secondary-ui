import { Box, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useAppStateContext } from '../../context';
import {
  TELEMETRY_FIELDS,
  MAX_TELEMETRY_SELECTIONS,
  TELEMETRY_CATEGORY_LABELS,
} from '../../types/constants/telemetryFields';
import type { TelemetryCategory } from '../../types';

/**
 * Telemetry selection controls for the sidebar.
 * Displays checkboxes grouped by category with max 3 selection limit.
 */
export const TelemetryToggle = () => {
  const { state, toggleTelemetry, canSelectMoreTelemetry } = useAppStateContext();
  const { selectedTelemetry } = state;

  const categories: TelemetryCategory[] = [
    'attitude',
    'angular',
    'linear',
    'environment',
    'actuator',
  ];

  return (
    <Box>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <ShowChartIcon fontSize="small" />
        Telemetry ({selectedTelemetry.length}/{MAX_TELEMETRY_SELECTIONS})
      </Typography>

      {categories.map((category) => {
        const fieldsInCategory = TELEMETRY_FIELDS.filter((f) => f.category === category);

        return (
          <Box key={category} sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              {TELEMETRY_CATEGORY_LABELS[category]}
            </Typography>
            <FormGroup>
              {fieldsInCategory.map((field) => {
                const isSelected = selectedTelemetry.includes(field.id);
                const isDisabled = !isSelected && !canSelectMoreTelemetry;

                return (
                  <FormControlLabel
                    key={field.id}
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTelemetry(field.id)}
                        disabled={isDisabled}
                        size="small"
                      />
                    }
                    label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.8rem',
                        color: isDisabled ? 'text.disabled' : 'text.primary',
                      },
                    }}
                  />
                );
              })}
            </FormGroup>
          </Box>
        );
      })}
    </Box>
  );
};
