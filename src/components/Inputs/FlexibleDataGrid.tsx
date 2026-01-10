import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { Box } from '@mui/material';

interface FlexibleDataGridProps {
  data: GridValidRowModel[];
  columns: GridColDef<GridValidRowModel>[];
  pageSize?: number;
  rowHeight?: number;
  onProcessRowUpdate?: (newRow: GridValidRowModel, oldRow: GridValidRowModel) => GridValidRowModel;
}

export const FlexibleDataGrid = ({
  data,
  columns,
  pageSize = 4,
  rowHeight = 74,
  onProcessRowUpdate,
}: FlexibleDataGridProps) => {
  console.log('FlexibleDataGrid data:', data);
  return (
    <Box
      sx={{
        height: 400,
        width: '100%',
        display: 'flex',
      }}
    >
      <DataGrid
        rows={data}
        columns={columns}
        rowHeight={rowHeight}
        initialState={{
          pagination: {
            paginationModel: { pageSize: pageSize, page: 0 },
          },
        }}
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        pageSizeOptions={[pageSize]}
        sx={{
          flex: 1,
          '& .MuiDataGrid-columnHeader:focus': {
            backgroundColor: 'warning.light',
          },
          '& .MuiDataGrid-cell:focus': {
            backgroundColor: 'warning.light',
          },
          '& .MuiDataGrid-columnHeader:focus-within': {
            backgroundColor: 'warning.light',
          },
          '& .MuiDataGrid-cell:focus-within': {
            backgroundColor: 'warning.light',
          },
          '& .MuiDataGrid-iconButtonContainer': {
            color: 'primary.light',
          },
          '& .MuiDataGrid-sortIcon': {
            color: 'primary.light',
          },
          '& .MuiDataGrid-menuIcon': {
            color: 'primary.light',
          },
        }}
        processRowUpdate={onProcessRowUpdate}
      />
    </Box>
  );
};
