import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { Box } from '@mui/material';

interface FlexibleDataGridProps {
  data: GridValidRowModel[];
  columns: GridColDef<GridValidRowModel>[];
  height?: number;
  width?: number;
}

// ...existing code...
export const FlexibleDataGrid = ({ data, columns, height, width }: FlexibleDataGridProps) => {
  return (
    <Box
      sx={{
        height: height || 400,
        width: width || '100%',
        display: 'flex',
        backgroundColor: 'green',
      }}
    >
      <DataGrid rows={data} columns={columns} sx={{ flex: 1, backgroundColor: 'red' }} />
    </Box>
  );
};
