import { Chip } from '@mui/material';
import { ThreatLevel } from '../../types';

export const ThreatChip = ({ level }: { level: keyof typeof ThreatLevel }) => {
  const colors: Record<keyof typeof ThreatLevel, { background: string; text: string }> = {
    UNKNOWN: { background: 'primary.light', text: 'primary.dark' },
    GREEN: { background: 'success.main', text: '#ffffffff' },
    YELLOW: { background: 'warning.main', text: '#ffffffff' },
    RED: { background: 'error.main', text: '#ffffffff' },
  };

  const { background, text } = colors[level] ?? colors.UNKNOWN;

  return (
    <Chip
      label={level ?? 'UNKNOWN'}
      size="small"
      sx={{
        backgroundColor: background,
        color: text,
        fontWeight: 700,
      }}
    />
  );
};
