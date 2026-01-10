import { TextField } from '@mui/material';

interface TextInputProps {
  value: string;
  label: string;
  onChange: (newValue: string) => void;
  lowerText?: string;
}
export const TextInput = ({ value, label, onChange, lowerText }: TextInputProps) => {
  return (
    <TextField
      value={value}
      label={label}
      onChange={(e) => onChange(e.target.value)}
      helperText={lowerText}
      sx={{
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'primary.light',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'warning.main',
        },
        '& .MuiFormLabel-root.Mui-focused': {
          color: 'secondary.main',
        },
      }}
    />
  );
};
