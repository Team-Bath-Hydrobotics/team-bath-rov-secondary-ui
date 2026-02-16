import { Box, Button } from '@mui/material';
import { FileUpload } from '@mui/icons-material';
import { useRef } from 'react';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';

interface UploadComponentProps {
  buttonText: string;
  displayText: string;
  onChange: (files: File[]) => void;

  multiple?: boolean;
  accept?: string;
  directory?: boolean;
  filterImages?: boolean;
}

export const UploadComponent = ({
  buttonText,
  displayText,
  onChange,
  multiple = true,
  accept,
  directory = false,
  filterImages = false,
}: UploadComponentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    let fileArray = Array.from(files);

    if (filterImages) {
      fileArray = fileArray.filter((f) => f.type.startsWith('image/'));
    }

    onChange(fileArray);
  };

  return (
    <Box>
      <HorizontalPageContentLayout>
        <Button
          variant="contained"
          startIcon={<FileUpload />}
          onClick={() => inputRef.current?.click()}
        >
          {buttonText}
        </Button>

        {displayText}

        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={accept}
          {...(directory
            ? ({
                webkitdirectory: '',
                directory: '',
              } as React.InputHTMLAttributes<HTMLInputElement>)
            : {})}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </HorizontalPageContentLayout>
    </Box>
  );
};
