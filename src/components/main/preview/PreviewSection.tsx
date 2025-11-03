import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Stack,
  Typography,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
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
import { GerberSocketChip } from "./GerberSocketChip";

export default function PreviewSection() {
  const gerberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gerberSocketsInfo, setGerberSocketsInfo] = useState<GerberSocket[]>(
    []
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusSeverity, setStatusSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("error");

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [layerViewMode, setLayerViewMode] = useState<boolean>(false);

  const handleUpload = (file: File | null) => {
    if (file) {
      // Set flag to show canvas
      setUploadedFile(file);
      // Store the file to process after canvas is mounted
      setPendingFile(file);
    }
  };

  // TODO: Just trigger the re-draw, rather than re-processing the whole file.
  // But for now, this is simpler than storing canvas and gerberset state.
  const handleViewModeChange = (value: string | null) => {
    if (value) setLayerViewMode(value === "layer");

    // Re-process the file to update the rendering
    setPendingFile(uploadedFile);
    processFile();
  };

  // Process the file once canvas is available
  const processFile = () => {
    if (pendingFile && gerberCanvasRef.current) {
      handleGerberUpload(
        pendingFile,
        gerberCanvasRef.current,
        !layerViewMode,
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
    if (uploadedFile && gerberCanvasRef.current && pendingFile) {
      processFile();
    }
  }, [uploadedFile, pendingFile]);

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
    setUploadedFile(null);
    setPendingFile(null);
  };

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <CustomDivider name="Preview and verify GerberSockets" />

      {/* Show upload box when nothing was uploaded */}
      {!uploadedFile && (
        <Box>
          <Box sx={{ pb: 1, color: "text.secondary" }}>
            Upload Gerber files for a single module or a complete board exported
            from MakeDevice
          </Box>

          <FileUploadDropZone
            onFileDrop={handleUpload}
            accept={".zip," + validGerberExtensions.filter((ext) => ext !== ".zip").join(",")} // Putting .zip first for clarity
          />
        </Box>
      )}

      {/* Show canvas when file has been uploaded */}
      {uploadedFile && (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box sx={{ color: "text.secondary" }}>
              Render of the uploaded Gerber files with detected GerberSockets
            </Box>

            {/* ToggleButton to swap between Layer and Board view */}
            <ToggleButtonGroup
              value={layerViewMode ? "layer" : "board"}
              exclusive
              onChange={(_, value) => {
                handleViewModeChange(value);
              }}
              size="small"
              sx={{ mr: 2 }}
            >
              <ToggleButton value="layer">Layer View</ToggleButton>
              <ToggleButton value="board">Board View</ToggleButton>
            </ToggleButtonGroup>

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

            {/* Absolute positioned GerberSocketsChips overlaying canvas which you can hover over for their ASCII value */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {gerberSocketsInfo.map((socket, index) => {
                if (socket.canvasX === undefined || socket.canvasY === undefined) {
                  return null;
                }

                return (
                  <GerberSocketChip
                    key={index}
                    canvasX={socket.canvasX}
                    canvasY={socket.canvasY}
                    ascii={socket.ascii}
                    brighter={!layerViewMode}
                  />
                );
              })}
            </Box>
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
                            x: {socket.x.toFixed(3)}, y: {socket.y.toFixed(3)}{socket?.diameters ? `, diameters: [${socket.diameters.join(", ")}]` : ''}
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
