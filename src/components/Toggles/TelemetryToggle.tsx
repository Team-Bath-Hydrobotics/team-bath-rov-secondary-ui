import { Box, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useAppStateContext } from '../../context';
import { TELEMETRY_FIELDS, TELEMETRY_CATEGORY_LABELS } from '../../types/constants/telemetryFields';
import type { TelemetryCategory } from '../../types';
import React from 'react';
/**
 * Telemetry selection controls for the sidebar.
 * Displays checkboxes grouped by category with max 3 selection limit.
 */

interface TelemetryToggleProps {
  isCopilot: boolean;
}

export const TelemetryToggle = React.memo(({ isCopilot }: TelemetryToggleProps) => {
  const { state, toggleTelemetry, canSelectMoreTelemetry } = useAppStateContext();
  const selectedTelemetry = isCopilot ? state.selectedTelemetryCopilot : state.selectedTelemetry;
  const categories: TelemetryCategory[] = [
    'attitude',
    'angular',
    'linear',
    'environment',
    'actuator',
  ];

  return (
    <>
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
                const isDisabled = !isSelected && !canSelectMoreTelemetry(isCopilot);
                return (
                  <FormControlLabel
                    key={field.id}
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTelemetry(field.id, isCopilot, isCopilot)}
                        disabled={isDisabled}
                        size="small"
                        sx={{
                          color: isDisabled ? 'text.disabled' : 'text.secondary',
                          '&.Mui-checked': {
                            color: 'success.main',
                          },
                        }}
                      />
                    }
                    label={`${field.label}`}
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
    </>
  );
});
