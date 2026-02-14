import { MainContentLayout } from '../../layouts/MainContentLayout';
import { Box } from '@mui/material';
import { TelemetryTile } from '../../components/Tiles/TelemetryTile';
import { useAppStateContext } from '../../context';
import type { TelemetryDataPoint } from '../../types/constants';
import { UploadComponent } from '../../components/Inputs';
import { parseCsvToDataPoints } from '../../utils/csvToDataPoint';
import { useEffect, useState } from 'react';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';

const FloatContent = () => {
  const { state, updateFloatFile } = useAppStateContext();
  const { csvFile } = state.floatFile;

  const [dataPoints, setDataPoints] = useState<TelemetryDataPoint[]>([]);

  const handleFileUpload = async (file: File) => {
    const parsed = await parseCsvToDataPoints(file);
    setDataPoints(parsed);
  };

  useEffect(() => {
    if (!csvFile) return;

    let cancelled = false;

    const parse = async () => {
      const parsed = await parseCsvToDataPoints(csvFile);
      if (!cancelled) {
        setDataPoints(parsed);
      }
    };

    parse();

    return () => {
      cancelled = true;
    };
  }, [csvFile]);

  return (
    <Box sx={{ padding: 2 }}>
      <VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <UploadComponent
            buttonText="Upload CSV Data"
            displayText={csvFile ? csvFile.name : 'No file uploaded'}
            accept=".csv"
            onChange={async (value) => {
              const file = value[0];
              if (!file) return;

              updateFloatFile({ csvFile: file });
              await handleFileUpload(file);
            }}
          />
        </VerticalPageContentLayout>
        <TelemetryTile
          fieldId="Depth"
          label="Depth"
          selected={true}
          data={dataPoints}
          isLive={false}
          disconnectedMessage={'Upload a CSV file to display telemetry data'}
        />{' '}
      </VerticalPageContentLayout>
    </Box>
  );
};

export const Float = () => {
  return (
    <MainContentLayout name="Float">
      <FloatContent />
    </MainContentLayout>
  );
};
