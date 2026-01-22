import { Box, Typography } from '@mui/material';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { EdnaCalculator } from '../../components/EdnaCalculator';
import { SonarPlaceholder } from '../../components/SonarPlaceholder';

const EDnaContent = () => {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900 }}>
      {/* eDNA Calculator Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Species Frequency Calculator
        </Typography>
        <EdnaCalculator />
      </Box>

      {/* Sonar Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Sonar
        </Typography>
        <SonarPlaceholder />
      </Box>
    </Box>
  );
};

export const EDna = () => {
  return (
    <MainContentLayout name="eDNA + Sonar Interface">
      <EDnaContent />
    </MainContentLayout>
  );
};
