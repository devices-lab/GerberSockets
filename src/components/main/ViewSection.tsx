import { Box, Button, Stack } from '@mui/material';
import CustomDivider from "./CustomDivider";

export default function ViewSection() {
  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <CustomDivider name="View ASCII GerberSockets" />

      {/* Button to upload a gerber file */}
      <Box sx={{ maxWidth: 720 }}>
        <Stack spacing={2}>
          <Button
            variant="contained"
            component="label"
            sx={{ maxWidth: 200 }}
          >
            Upload Gerber
            <input
              type="file"
              accept=".zip,.gbr,.gerber"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle file upload logic here
                  alert(`Uploaded file: ${file.name}`);
                }
              }}
            />
          </Button>
        </Stack>
      </Box>

      <Box>
        <canvas
          id="gerber-canvas"
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
