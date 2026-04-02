import { MainContentLayout } from '../../layouts/MainContentLayout';
import { useAppStateContext } from '../../context';
import { TextInput } from '../../components/Inputs/TextInput';
import { Box } from '@mui/material';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import { UploadComponent } from '../../components/Inputs/UploadComponent';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { FlexibleDataGrid } from '../../components/Inputs/FlexibleDataGrid';
import { Button } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { ImageTile } from '../../components/Tiles/ImageTile';
import { type GridValidRowModel } from '@mui/x-data-grid';
import type { PlatformData } from '../../types';
import { ThreatLevel } from '../../types';
import { Chip } from '@mui/material';

const ThreatChip = ({ level }: { level: keyof typeof ThreatLevel }) => {
  const colors: Record<keyof typeof ThreatLevel, { bg: string; text: string }> = {
    UNKNOWN: { bg: '#2d3c50ff', text: '#ffffffff' },
    LOW: { bg: '#0e6038ff', text: '#ffffffff' },
    MEDIUM: { bg: '#846a00ff', text: '#ffffffff' },
    HIGH: { bg: '#6d0000ff', text: '#ffffffff' },
  };

  const { bg, text } = colors[level];

  return (
    <Chip
      label={level}
      size="small"
      sx={{
        backgroundColor: bg,
        color: text,
        fontWeight: 700,
      }}
    />
  );
};

const NM_PER_DEGREE = 60;

const latlonToNm = (latRef: number, lonRef: number, lat: number, lon: number): [number, number] => {
  const y = (lat - latRef) * NM_PER_DEGREE;
  const x = (lon - lonRef) * NM_PER_DEGREE;
  return [x, y];
};

const headingToUnitVector = (heading: number): [number, number] => {
  const rad = (heading * Math.PI) / 180;
  return [Math.sin(rad), Math.cos(rad)];
};

const distancePointToLine = (px: number, py: number, dx: number, dy: number): number => {
  return Math.abs(px * dy - py * dx);
};

const surfaceThreat = (
  distanceNm: number,
  keelDepth: number,
  waterDepth: number,
): keyof typeof ThreatLevel => {
  if (keelDepth >= 1.1 * waterDepth) return 'LOW';
  if (distanceNm > 10) return 'LOW';
  if (distanceNm >= 5) return 'MEDIUM';
  return 'HIGH';
};

const subseaThreat = (
  distanceNm: number,
  keelDepth: number,
  waterDepth: number,
): keyof typeof ThreatLevel => {
  if (distanceNm > 25) return 'LOW';
  const ratio = keelDepth / waterDepth;
  if (ratio >= 1.1) return 'LOW';
  if (ratio >= 0.9) return 'HIGH';
  if (ratio >= 0.7) return 'MEDIUM';
  return 'LOW';
};

const formatThreat = (level: keyof typeof ThreatLevel) => {
  switch (level) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    default:
      return 'Unknown';
  }
};

const IcebergThreatContent = () => {
  const { state, updateIcebergCalculationData } = useAppStateContext();
  const { icebergDepth, platformData, imageFile } = state.icebergCalculationData;

  const platformInputColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, editable: true, headerClassName: 'bold-header' },
    {
      field: 'latitude',
      headerName: 'Latitude',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'oceanDepth',
      headerName: 'Ocean Depth',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
  ];

  const platformOutputColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, headerClassName: 'bold-header' },
    {
      field: 'generalThreatLevel',
      headerName: 'General Threat',
      flex: 1,
      headerClassName: 'bold-header',
      renderCell: (params) => <ThreatChip level={params.value as keyof typeof ThreatLevel} />,
    },

    {
      field: 'subsurfaceThreatLevel',
      headerName: 'Subsurface Threat',
      flex: 1,
      headerClassName: 'bold-header',
      renderCell: (params) => <ThreatChip level={params.value as keyof typeof ThreatLevel} />,
    },
  ];

  const handleRowUpdate = (newRow: GridValidRowModel) => {
    const updatedData = platformData.map((row) => (row.id === newRow.id ? newRow : row));
    updateIcebergCalculationData({
      icebergDepth,
      platformData: updatedData as PlatformData[],
      imageFile,
    });
    return newRow;
  };

  const calculateThreats = () => {
    const iceberg = {
      lat: 46,
      lon: -48.5,
      heading: 45,
      keelDepth: icebergDepth,
    };

    const [dx, dy] = headingToUnitVector(iceberg.heading);

    const updated = platformData.map((p) => {
      const [px, py] = latlonToNm(
        iceberg.lat,
        iceberg.lon,
        Number(p.latitude),
        Number(p.longitude),
      );

      const distanceNm = distancePointToLine(px, py, dx, dy);

      return {
        ...p,
        generalThreatLevel: formatThreat(
          surfaceThreat(distanceNm, iceberg.keelDepth, Number(p.oceanDepth)),
        ),
        subsurfaceThreatLevel: formatThreat(
          subseaThreat(distanceNm, iceberg.keelDepth, Number(p.oceanDepth)),
        ),
      };
    });

    updateIcebergCalculationData({
      icebergDepth,
      platformData: updated as PlatformData[],
      imageFile,
    });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <UploadComponent
            buttonText="Upload Iceberg Data"
            displayText={imageFile ? imageFile.name : 'No file uploaded'}
            // Extract only the first uploaded file, as iceberg page only keeps track of one image
            onChange={(value) =>
              updateIcebergCalculationData({ icebergDepth, platformData, imageFile: value[0] })
            }
            accept={'.JPG, .PNG, .JPEG, .jpeg, .png, .heic'}
          ></UploadComponent>
          <ImageTile
            imagefile={imageFile ?? new File([], 'Iceberg Map.png')}
            altTitle="Iceberg Image"
          ></ImageTile>
          <HorizontalPageContentLayout>
            <Button variant="contained" onClick={calculateThreats}>
              Calculate
            </Button>
            <TextInput
              label="Iceberg Keel Depth"
              value={icebergDepth.toString()}
              onChange={(value) => {
                const numValue = value === '' ? 0 : Number(value);
                if (!isNaN(numValue)) {
                  updateIcebergCalculationData({ icebergDepth: numValue, platformData, imageFile });
                }
              }}
            ></TextInput>
          </HorizontalPageContentLayout>
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <FlexibleDataGrid
            data={platformData}
            columns={platformInputColumns}
            onProcessRowUpdate={handleRowUpdate}
          ></FlexibleDataGrid>
          <FlexibleDataGrid
            data={platformData}
            columns={platformOutputColumns}
            onProcessRowUpdate={handleRowUpdate}
          ></FlexibleDataGrid>
        </VerticalPageContentLayout>
      </HorizontalPageContentLayout>
    </Box>
  );
};

export const IcebergThreat = () => {
  return (
    <MainContentLayout name="Iceberg Threat">
      <IcebergThreatContent />
    </MainContentLayout>
  );
};
