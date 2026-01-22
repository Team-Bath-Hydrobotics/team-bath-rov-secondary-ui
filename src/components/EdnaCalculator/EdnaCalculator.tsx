import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import type { SpeciesEntry } from '../../types';
import { createInitialSpeciesEntries } from '../../types/constants';

/**
 * eDNA Calculator for MATE ROV 2026 Task 2.5
 * Calculates % Frequency = (Number Seen / Total Count) × 100
 */
export const EdnaCalculator = () => {
  const [species, setSpecies] = useState<SpeciesEntry[]>(createInitialSpeciesEntries);
  const [isCalculated, setIsCalculated] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Calculate total count from all species
  const totalCount = species.reduce((sum, s) => sum + (s.numberSeen ?? 0), 0);

  // Sum of all percentages (verification - should equal ~100%)
  const percentageSum = isCalculated
    ? species.reduce((sum, s) => sum + (s.percentFrequency ?? 0), 0)
    : null;

  // Check if calculation can be performed (at least one non-zero entry)
  const canCalculate = species.some((s) => s.numberSeen !== null && s.numberSeen > 0);

  // Handle input change - only allow non-negative integers
  const handleInputChange = useCallback((id: string, value: string) => {
    // Strip non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    const parsedValue = numericValue === '' ? null : parseInt(numericValue, 10);

    setSpecies((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, numberSeen: parsedValue, percentFrequency: null }
          : { ...s, percentFrequency: null },
      ),
    );
    setIsCalculated(false);
  }, []);

  // Handle key navigation - Tab/Enter moves to next input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        const nextIndex = index + 1;
        if (nextIndex < species.length) {
          inputRefs.current[nextIndex]?.focus();
          inputRefs.current[nextIndex]?.select();
        }
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          inputRefs.current[prevIndex]?.focus();
          inputRefs.current[prevIndex]?.select();
        }
      }
    },
    [species.length],
  );

  // Calculate % Frequency for all species
  const handleCalculate = useCallback(() => {
    if (totalCount === 0) return;

    setSpecies((prev) =>
      prev.map((s) => ({
        ...s,
        // Formula: % Frequency = (Number Seen / Total Count) × 100
        percentFrequency: s.numberSeen !== null ? (s.numberSeen / totalCount) * 100 : 0,
      })),
    );
    setIsCalculated(true);
  }, [totalCount]);

  // Reset all inputs
  const handleReset = useCallback(() => {
    setSpecies(createInitialSpeciesEntries());
    setIsCalculated(false);
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: 'background.paper',
          '& .MuiTableCell-root': {
            borderColor: 'divider',
          },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.dark' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '55%' }}>
                Species
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 'bold', color: 'text.primary', width: '20%' }}
              >
                Number Seen
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 'bold', color: 'text.primary', width: '25%' }}
              >
                % Frequency
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {species.map((s, index) => (
              <TableRow key={s.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {s.commonName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                  >
                    ({s.scientificName})
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    size="small"
                    variant="outlined"
                    value={s.numberSeen ?? ''}
                    onChange={(e) => handleInputChange(s.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      style: { textAlign: 'center' },
                    }}
                    sx={{
                      width: 80,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.default',
                      },
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      color: isCalculated ? 'success.main' : 'text.secondary',
                    }}
                  >
                    {s.percentFrequency !== null ? s.percentFrequency.toFixed(8) : '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
          backgroundColor: 'primary.dark',
          borderRadius: 1,
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Total Count: {totalCount}
        </Typography>
        {isCalculated && percentageSum !== null && (
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(percentageSum - 100) < 0.01 ? 'success.main' : 'warning.main',
            }}
          >
            Sum: {percentageSum.toFixed(2)}%
          </Typography>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCalculate}
          disabled={!canCalculate}
          sx={{ flex: 1, py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
        >
          Calculate % Frequency
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleReset} sx={{ py: 1.5 }}>
          Reset
        </Button>
      </Box>

      {/* Warning if no valid data */}
      {!canCalculate && (
        <Typography variant="caption" color="warning.main" sx={{ textAlign: 'center' }}>
          Enter at least one species count to calculate
        </Typography>
      )}
    </Box>
  );
};
