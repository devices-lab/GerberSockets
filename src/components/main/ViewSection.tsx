import { Box, Stack } from '@mui/material';
import CustomDivider from "./CustomDivider";
import { handleGerberUpload, validGerberExtensions } from './ParseGerber';
import { useRef, useState } from 'react';
import FileUploadDropZone from './FileUploadDropZone';
import type { GerberSocket } from './ParseSockets';
import { Typography } from '@mui/material';

export default function ViewSection() {
  const gerberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gerberSocketsInfo, setGerberSocketsInfo] = useState<GerberSocket[]>([]);

  const handleUpload = (file: File | null) => {
    if (file) {
      handleGerberUpload(file, gerberCanvasRef.current!, (sockets: GerberSocket[]) => {
        setGerberSocketsInfo(sockets);
      });
    }
  };

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <CustomDivider name="View ASCII GerberSockets" />

      <FileUploadDropZone
        onFileDrop={handleUpload}
        message="Click, or drop a Gerber/ZIP file here"
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

      {/* TODO: Gerber info for each gerber socket listed */}
      <Box>
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Gerber Socket Info
          </Typography>

          {/* Socket info boxes */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'wrap',
            gap: 1,
          }}>
            {gerberSocketsInfo.length === 0 ? (
              <Typography variant="body2">No Gerber sockets loaded.</Typography>
            ) : (
              gerberSocketsInfo.map((socket, index) => (
                <Box key={index} sx={{ p: 1, pr: 3, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{socket.ascii}</Typography>
                  <Typography variant="body2">x: {socket.x}, y: {socket.y}</Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Stack>
  )
}
