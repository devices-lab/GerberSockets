import { Box, Stack } from '@mui/material';
import CustomDivider from "./CustomDivider";
import { handleGerberUpload, validGerberExtensions } from './ParseGerber';
import { useRef } from 'react';
import FileUploadDropZone from './FileUploadDropZone';

export default function ViewSection() {
  const gerberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleUpload = (file: File | null) => {
    if (file) handleGerberUpload(file, gerberCanvasRef.current!);
  };


  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <CustomDivider name="View ASCII GerberSockets" />

      <FileUploadDropZone
        onFileDrop={handleUpload}
        accept={".zip," + validGerberExtensions.join("")}
      />

      <Box>
        <canvas
          ref={gerberCanvasRef}
          style={{
            border: '1px solid #ccc',
            width: '100%',
            height: '100%',
            backgroundColor: '#f9f9f9',
          }}
        />
      </Box>
    </Stack>
  )
}
