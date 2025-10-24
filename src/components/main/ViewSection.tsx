import { Box, Stack } from "@mui/material";
import CustomDivider from "./CustomDivider";
import { handleGerberUpload, validGerberExtensions } from "./parseGerber";
import { useRef, useState } from "react";
import FileUploadDropZone from "./FileUploadDropZone";
import type { GerberSocket } from "./parseSockets";
import { Typography } from "@mui/material";
import { Alert, AlertTitle } from "@mui/material";

export default function ViewSection() {
  const gerberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gerberSocketsInfo, setGerberSocketsInfo] = useState<GerberSocket[]>(
    []
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusSeverity, setStatusSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("error");

  const handleUpload = (file: File | null) => {
    if (file) {
      handleGerberUpload(
        file,
        gerberCanvasRef.current!,
        setStatusMessage,
        setStatusSeverity,
        (sockets: GerberSocket[]) => {
          setGerberSocketsInfo(sockets);
        }
      );
    }
  };

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <CustomDivider name="View ASCII GerberSockets" />

      <FileUploadDropZone
        onFileDrop={handleUpload}
        message="Click, or drop a Gerber/ZIP file here to view its GerberSockets"
        accept={".zip," + validGerberExtensions.join("")} // Putting .zip first so it's clearer for the user
      />

      <Box>
        <canvas
          ref={gerberCanvasRef}
          style={{
            border: "1px solid #ccc",
            width: "100%",
            height: "100%",
            backgroundColor: "#f9f9f9",
          }}
        />
      </Box>

      {/* Gerber info for each gerber socket listed */}
      <Box>
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            GerberSocket Info
          </Typography>

          {/* Error or info message */}
          {statusMessage && (
            <Alert severity={statusSeverity} sx={{ mb: 2 }}>
              {(statusSeverity === "error" || statusSeverity === "warning") && (
                <AlertTitle>
                  {statusSeverity.charAt(0).toUpperCase() +
                    statusSeverity.slice(1)}
                </AlertTitle>
              )}
              {statusMessage}
            </Alert>
          )}

          {/* Socket info boxes */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {!gerberSocketsInfo.length ? (
              <Typography variant="body2">No Gerber sockets loaded.</Typography>
            ) : (
              gerberSocketsInfo.map((socket, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1,
                    pr: 3,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1">{socket.ascii}</Typography>
                  <Typography variant="body2">
                    x: {socket.x}, y: {socket.y}
                  </Typography>
                  {socket.diameters !== undefined && (
                    <Typography variant="body2">
                      diameters: [{socket.diameters.join(", ")}]
                    </Typography>
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
