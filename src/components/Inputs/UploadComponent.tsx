import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { Box, Button } from '@mui/material';
import { FileUpload } from '@mui/icons-material';

interface UploadComponentProps {
  buttonText: string;
  displayText: string;
  onChange: (newValue: string) => void;
}
export const UploadComponent = ({ buttonText, displayText, onChange }: UploadComponentProps) => {
  return (
    <Box>
      <HorizontalPageContentLayout>
        <Button variant="contained" component="label">
          <FileUpload></FileUpload>
          {buttonText}
          <input type="file" hidden onChange={(e) => onChange(e.target.value)} />
        </Button>
        {displayText}
      </HorizontalPageContentLayout>
    </Box>
  );
};
