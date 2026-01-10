import { MainContentLayout } from '../../layouts/MainContentLayout';
import { useAppStateContext } from '../../context';
import { TextInput } from '../../components/Inputs/TextInput';
import { Box } from '@mui/material';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import { UploadComponent } from '../../components/Inputs/UploadComponent';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { FlexibleDataGrid } from '../../components/Inputs/FlexibleDataGrid';
import { Button } from '@mui/material';

import { ImageTile } from '../../components/Tiles/ImageTile';
const IcebergThreatContent = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <UploadComponent
            buttonText="Upload Iceberg Data"
            displayText="No file selected"
            onChange={() => '1'}
          ></UploadComponent>
          <ImageTile
            imagefile={new File([], 'placeholder.jpg')}
            altTitle="Iceberg Image"
          ></ImageTile>
          <HorizontalPageContentLayout>
            <Button>Calculate</Button>
            <TextInput label="Iceberg Keel Depth" value="0" onChange={() => {}}></TextInput>
          </HorizontalPageContentLayout>
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <FlexibleDataGrid data={[]} columns={[]}></FlexibleDataGrid>
          <FlexibleDataGrid data={[]} columns={[]}></FlexibleDataGrid>
        </VerticalPageContentLayout>
      </HorizontalPageContentLayout>
    </Box>
  );
};

export const IcebergThreat = () => {
  const { state } = useAppStateContext();
  console.log(state);
  return (
    <MainContentLayout name="Iceberg Threat">
      <IcebergThreatContent />
    </MainContentLayout>
  );
};
