import { Box, Button, Paper, Typography } from '@mui/material';
import { FileUpload } from '@mui/icons-material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useRef } from 'react';

interface FolderUploadComponentProps {
  buttonText: string;
  displayText: string;
  onChange: (files: File[]) => void;
}

export const FolderUploadComponent = ({
  buttonText,
  displayText,
  onChange,
}: FolderUploadComponentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    onChange(imageFiles);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 2,
          borderRadius: '16px',
          backgroundColor: 'background.paper',
        }}
      >
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FileUpload />}
          onClick={handleClick}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          {buttonText}
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          {...({
            webkitdirectory: '',
            directory: '',
          } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={handleChange}
        />
      </Paper>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderRadius: '16px',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-all' }}>
          {displayText}
        </Typography>
      </Paper>
    </Box>
  );
};
