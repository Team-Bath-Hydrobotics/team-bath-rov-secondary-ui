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
import type { PlatformData, ThreatLevel } from '../../types';

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
    { field: 'name', headerName: 'Name', flex: 1, editable: true, headerClassName: 'bold-header' },
    {
      field: 'generalThreatLevel',
      headerName: 'General Threat',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'subsurfaceThreatLevel',
      headerName: 'Subsurface Threat',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
  ];

  const handleRowUpdate = (newRow: GridValidRowModel) => {
    const updatedData = platformData.map((row) => (row.id === newRow.id ? newRow : row));
    updateIcebergCalculationData({
      icebergDepth,
      platformData: GridDataToCalcData(updatedData),
      imageFile,
    });
    return newRow;
  };

  const GridDataToCalcData = (data: GridValidRowModel[]): PlatformData[] => {
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      oceanDepth: Number(row.oceanDepth),
      generalThreatLevel: row.generalThreatLevel as (typeof ThreatLevel)[keyof typeof ThreatLevel],
      subsurfaceThreatLevel:
        row.subsurfaceThreatLevel as (typeof ThreatLevel)[keyof typeof ThreatLevel],
    }));
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
          ></UploadComponent>
          <ImageTile
            imagefile={imageFile ?? new File([], 'Iceberg Map.png')}
            altTitle="Iceberg Image"
          ></ImageTile>
          <HorizontalPageContentLayout>
            <Button variant="contained">Calculate</Button>
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
