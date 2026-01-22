import { Box, Typography } from '@mui/material';

interface CrabCounterProps {
  count: number;
}

export const CrabCounter = ({ count }: CrabCounterProps) => (
  <Box
    sx={{
      width: 220,
      bgcolor: 'primary.main',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.primary',
    }}
  >
    <Typography variant="body2" sx={{ opacity: 0.8 }}>
      European Green Crabs Detected:
    </Typography>
    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
      {count === null || count === undefined ? 'None Detected' : count}
    </Typography>
  </Box>
);
