import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { Box, Button } from '@mui/material';
import { FileUpload } from '@mui/icons-material';

interface UploadComponentProps {
  buttonText: string;
  displayText: string;
  onChange: (newValue: File[]) => void;
  accept?: string;
}
export const UploadComponent = ({
  buttonText,
  displayText,
  onChange,
  accept,
}: UploadComponentProps) => {
  return (
    <Box>
      <HorizontalPageContentLayout>
        <Button variant="contained" component="label">
          <FileUpload></FileUpload>
          {buttonText}
          <input
            type="file"
            multiple
            accept={accept ?? undefined}
            hidden
            onChange={(e) => onChange(e.target.files ? Array.from(e.target.files) : [])}
          />
        </Button>
        {displayText}
      </HorizontalPageContentLayout>
    </Box>
  );
};
