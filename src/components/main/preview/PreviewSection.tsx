import { useEffect, useRef, useState } from "react";
import { Alert, Box, Stack, Typography, Chip, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CustomDivider from "../CustomDivider";
import FileUploadDropZone from "./FileUploadDropZone";
import GridAlignmentAlert from "./GridAlignmentAlert";
import {
  handleGerberUpload,
  validGerberExtensions,
} from "../../../preview/parseGerber";
import type { GerberSocket } from "../../../preview/parseSockets";
import { isOnGrid, GRID_DIVISION } from "../../../preview/gridValidation";

export default function PreviewSection() {
  const gerberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gerberSocketsInfo, setGerberSocketsInfo] = useState<GerberSocket[]>(
    []
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusSeverity, setStatusSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("error");

  const [hasUploadedFile, setHasUploadedFile] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleUpload = (file: File | null) => {
    if (file) {
      // Set flag to show canvas
      setHasUploadedFile(true);
      // Store the file to process after canvas is mounted
      setPendingFile(file);
    }
  };

  // Process the file once canvas is available
  const processFile = () => {
    if (pendingFile && gerberCanvasRef.current) {
      handleGerberUpload(
        pendingFile,
        gerberCanvasRef.current,
        setStatusMessage,
        setStatusSeverity,
        (sockets: GerberSocket[]) => {
          setGerberSocketsInfo(sockets);
        }
      );
      setPendingFile(null);
    }
  };

  // Call processFile when canvas becomes available
  useEffect(() => {
    if (hasUploadedFile && gerberCanvasRef.current && pendingFile) {
      processFile();
    }
  }, [hasUploadedFile, pendingFile]);

  const handleReset = () => {
    // Clear the canvas
    const canvas = gerberCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Reset all state
    setGerberSocketsInfo([]);
    setStatusMessage(null);
    setHasUploadedFile(false);
    setPendingFile(null);
  };

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <CustomDivider name="Preview and verify GerberSockets" />

      {/* Show upload box when nothing was uploaded */}
      {!hasUploadedFile && (
        <Box>
          <Box sx={{ pb: 1, color: "text.secondary" }}>
            Upload Gerber files for a single module or a complete board exported
            from MakeDevice
          </Box>

          <FileUploadDropZone
            onFileDrop={handleUpload}
            accept={".zip," + validGerberExtensions.join("")}
          />
        </Box>
      )}

      {/* Show canvas when file has been uploaded */}
      {hasUploadedFile && (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box sx={{ color: "text.secondary" }}>
              Render of the uploaded Gerber files with detected GerberSockets
            </Box>
            <Button
              onClick={handleReset}
              startIcon={<CloseIcon />}
              variant="contained"
              sx={{
                backgroundColor: "primary.main",
              }}
            >
              Reset
            </Button>
          </Stack>

          {/* Canvas for rendering Gerber files */}
          <Box sx={{ position: "relative" }}>
            <canvas
              ref={gerberCanvasRef}
              style={{
                // border: "1px solid",
                width: "100%",
                height: "100%",
              }}
            />
          </Box>

          {/* Gerber info for each gerber socket listed */}
          <Box>
            <Box>
              <Box sx={{ color: "text.secondary" }}>
                Details about the extracted GerberSockets
              </Box>

              <Box sx={{ pt: 1 }}>
                {/* Grid alignment status */}
                <GridAlignmentAlert sockets={gerberSocketsInfo} />

                {/* Error or info message */}
                {statusMessage && (
                  <Alert severity={statusSeverity} sx={{ mb: 2 }}>
                    {statusMessage}
                  </Alert>
                )}

                {/* Socket info boxes */}
                <Stack spacing={1}>
                  {!gerberSocketsInfo.length ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      No GerberSockets loaded
                    </Typography>
                  ) : (
                    gerberSocketsInfo.map((socket, index) => {
                      const socketOnGrid =
                        isOnGrid(socket.x, GRID_DIVISION) &&
                        isOnGrid(socket.y, GRID_DIVISION);

                      return (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            borderRadius: 1,
                            backgroundColor: socketOnGrid
                              ? "transparent"
                              : "warning.light",
                            border: socketOnGrid ? "none" : "1px solid",
                            borderColor: socketOnGrid
                              ? "transparent"
                              : "warning.main",
                          }}
                        >
                          {/* Socket name chip */}
                          <Chip
                            label={socket.ascii || "N/A"}
                            sx={{
                              fontSize: "1rem",
                              height: 32,
                              px: 1,
                              fontFamily: "monospace",
                              backgroundColor: socket.ascii
                                ? "primary.main"
                                : "warning.main",
                              color: socket.ascii
                                ? "primary.contrastText"
                                : "warning.contrastText",
                              fontWeight: 500,
                            }}
                          />

                          {/* Socket details */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                            }}
                          >
                            x: {socket.x.toFixed(3)}, y: {socket.y.toFixed(3)}
                          </Typography>

                          {/* Grid alignment indicator */}
                          {!socketOnGrid && (
                            <Chip
                              label="Off Grid"
                              size="small"
                              color="warning"
                              sx={{
                                height: 24,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                        </Box>
                      );
                    })
                  )}
                </Stack>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Stack>
  );
}
