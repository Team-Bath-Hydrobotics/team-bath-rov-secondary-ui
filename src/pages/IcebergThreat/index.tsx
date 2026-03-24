import { MainContentLayout } from '../../layouts/MainContentLayout';
import { useAppStateContext } from '../../context';
import { TextInput } from '../../components/Inputs/TextInput';
import { Box, Button, Chip } from '@mui/material';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import { UploadComponent } from '../../components/Inputs/UploadComponent';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { FlexibleDataGrid } from '../../components/Inputs/FlexibleDataGrid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { ImageTile } from '../../components/Tiles/ImageTile';
import { type GridValidRowModel } from '@mui/x-data-grid';
import type { PlatformData, ThreatLevelType } from '../../types';
import { ThreatLevel } from '../../types';
import { calculateIcebergThreats } from '../../utils';

const threatColor = (level: ThreatLevelType): 'success' | 'warning' | 'error' | 'default' => {
  switch (level) {
    case ThreatLevel.GREEN:
      return 'success';
    case ThreatLevel.YELLOW:
      return 'warning';
    case ThreatLevel.RED:
      return 'error';
    default:
      return 'default';
  }
};

const ThreatChip = ({ value }: { value: ThreatLevelType }) => (
  <Chip label={value} color={threatColor(value)} size="small" variant="filled" />
);

const IcebergThreatContent = () => {
  const { state, updateIcebergCalculationData } = useAppStateContext();
  const { icebergLat, icebergLon, icebergHeading, keelDepth, platformData, imageFile } =
    state.icebergCalculationData;

  const updateField = (field: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    if (!isNaN(numValue)) {
      updateIcebergCalculationData({
        ...state.icebergCalculationData,
        [field]: numValue,
      });
    }
  };

  const platformInputColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Platform',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
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
      headerName: 'Depth (m)',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
  ];

  const platformOutputColumns: GridColDef[] = [
    { field: 'name', headerName: 'Platform', flex: 1, headerClassName: 'bold-header' },
    { field: 'distanceNm', headerName: 'Distance (nm)', flex: 1, headerClassName: 'bold-header' },
    {
      field: 'surfaceThreatLevel',
      headerName: 'Surface Threat',
      flex: 1,
      headerClassName: 'bold-header',
      renderCell: (params: GridRenderCellParams) => <ThreatChip value={params.value} />,
    },
    {
      field: 'subseaThreatLevel',
      headerName: 'Subsea Threat',
      flex: 1,
      headerClassName: 'bold-header',
      renderCell: (params: GridRenderCellParams) => <ThreatChip value={params.value} />,
    },
  ];

  const handleRowUpdate = (newRow: GridValidRowModel) => {
    const updatedData = platformData.map((row) =>
      row.id === newRow.id
        ? {
            ...row,
            name: newRow.name,
            latitude: Number(newRow.latitude),
            longitude: Number(newRow.longitude),
            oceanDepth: Number(newRow.oceanDepth),
          }
        : row,
    );
    updateIcebergCalculationData({
      ...state.icebergCalculationData,
      platformData: updatedData as PlatformData[],
    });
    return newRow;
  };

  const handleCalculate = () => {
    const results = calculateIcebergThreats(icebergLat, icebergLon, keelDepth, platformData);
    updateIcebergCalculationData({
      ...state.icebergCalculationData,
      platformData: results,
    });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <UploadComponent
            buttonText="Upload Iceberg Image"
            displayText={imageFile ? imageFile.name : 'No file uploaded'}
            onChange={(value) =>
              updateIcebergCalculationData({ ...state.icebergCalculationData, imageFile: value[0] })
            }
            accept={'.JPG, .PNG, .JPEG, .jpeg, .png, .heic'}
          />
          <ImageTile
            imagefile={imageFile ?? new File([], 'Iceberg Map.png')}
            altTitle="Iceberg Image"
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextInput
              label="Iceberg Latitude"
              value={icebergLat === 0 ? '' : icebergLat.toString()}
              onChange={(v) => updateField('icebergLat', v)}
            />
            <TextInput
              label="Iceberg Longitude"
              value={icebergLon === 0 ? '' : icebergLon.toString()}
              onChange={(v) => updateField('icebergLon', v)}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextInput
              label="Heading (°)"
              value={icebergHeading === 0 ? '' : icebergHeading.toString()}
              onChange={(v) => updateField('icebergHeading', v)}
            />
            <TextInput
              label="Keel Depth (m)"
              value={keelDepth === 0 ? '' : keelDepth.toString()}
              onChange={(v) => updateField('keelDepth', v)}
            />
          </Box>
          <Button variant="contained" onClick={handleCalculate} sx={{ alignSelf: 'flex-start' }}>
            Calculate Threats
          </Button>
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <FlexibleDataGrid
            data={platformData}
            columns={platformInputColumns}
            onProcessRowUpdate={handleRowUpdate}
          />
          <FlexibleDataGrid data={platformData} columns={platformOutputColumns} />
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
