// NOTE: AI generated
import { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

type FileUploadDropZoneProps = {
  onFileDrop: (file: File) => void;
  message?: string;
  accept?: string;
};

export default function FileUploadDropZone({ onFileDrop, message, accept }: FileUploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
  };

  return (
    <Box
      onClick={handleClick}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed #aaa',
        borderRadius: 2,
        padding: 4,
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f0f0' : '#fafafa',
        transition: 'background-color 0.2s ease-in-out',
        cursor: 'pointer',
      }}
    >
      <Typography variant="body1">{message || "Click, or drop a file here"}</Typography>

      <input
        type="file"
        accept={accept}
        hidden
        ref={inputRef}
        onChange={handleFileSelect}
      />
    </Box>
  );
}
