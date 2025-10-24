import { useState } from "react";
import JSZip from "jszip";
import {
  generateLibrary,
  type UserInput,
  type EDA,
  type CrosshairLayer,
  type SocketsLayer,
} from "./../../generate/generateLibrary";

import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Collapse,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import CustomDivider from "./CustomDivider";

const ASCII_REGEX = /^[\x00-\x7F]*$/;

const POPULAR_GROUPS: Record<string, string[]> = {
  I2C: ["SDA", "SCL"],
  SPI: ["MOSI", "MISO", "SCK", "CS"],
  SWD: ["SWDIO~^", "SWCLK", "RESET"],
  UART: ["TX", "RX"],
  Jacdac: ["JD_PWR", "JD_DATA", "GND"],
};

export default function GenerateSection() {
  // Form state with defaults
  const [eda, setEda] = useState<EDA>("KiCad");
  const [netNames, setNetNames] = useState<string[]>([]);
  const [newNet, setNewNet] = useState<string>("");
  const [netError, setNetError] = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [crosshairLayer, setCrosshairLayer] = useState<CrosshairLayer>("F.Fab");
  const [socketsLayer, _setSocketsLayer] = useState<SocketsLayer>("User.1"); // NOTE: _setSocketsLayer not used at the moment
  const [copperPadDiameter, setCopperPadDiameter] = useState<number>(0.125);

  const handleAddNet = () => {
    const trimmed = newNet.trim();
    // Basic length check mirroring backend rule (1..99)
    if (trimmed.length < 1 || trimmed.length > 99) {
      setNetError("Net name length must be between 1 and 99 characters");
      return;
    }
    // ASCII-only check
    if (!ASCII_REGEX.test(trimmed)) {
      setNetError("Net name must contain only ASCII characters");
      return;
    }
    // Optional: prevent duplicates
    if (netNames.includes(trimmed)) {
      setNetError("Net name already added");
      return;
    }
    setNetNames((prev) => [...prev, trimmed]);
    setNewNet("");
    setNetError("");
  };

  const addGroup = (groupKey: keyof typeof POPULAR_GROUPS) => {
    const names = POPULAR_GROUPS[groupKey];
    // Validate against the same constraints used for single adds
    const validNew = names
      .map((n) => n.trim())
      .filter(
        (n) =>
          n.length >= 1 &&
          n.length <= 99 &&
          ASCII_REGEX.test(n) &&
          !netNames.includes(n)
      );
    if (validNew.length === 0) {
      return;
    }
    setNetNames((prev) => [...prev, ...validNew]);
  };

  const handleDeleteNet = (name: string) => {
    setNetNames((prev) => prev.filter((n) => n !== name));
  };

  const handleDownload = async () => {
    try {
      const payload: UserInput = {
        eda,
        netNames,
        crosshairLayer,
        socketsLayer,
        copperPadDiameter,
      };

      // Generate in-memory files
      const files = generateLibrary(payload);

      // Build ZIP structure: GerberSockets/...
      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });

      // Create blob and download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "GerberSockets.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to generate library");
    }
  };

  return (
    <>
      <CustomDivider name="Generate ASCII GerberSockets symbols and footprints" />
      <Box sx={{ maxWidth: 720 }}>
        <Stack spacing={2}>
          {/* EDA selection */}
          <FormControl>
            <FormLabel>Select EDA tool</FormLabel>
            <RadioGroup
              row
              value={eda}
              onChange={(e) => setEda(e.target.value as EDA)}
            >
              <FormControlLabel
                value="KiCad"
                control={<Radio />}
                label="KiCad"
              />
              <FormControlLabel
                value="Altium"
                control={<Radio />}
                label="Altium (not implemented)"
                disabled
              />
            </RadioGroup>
          </FormControl>

          {/* Net names input and list */}
          <Stack spacing={1}>
            <FormLabel>Add net names</FormLabel>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ my: 0 }}
            >
              <TextField
                fullWidth
                label="Net name"
                value={newNet}
                sx = {{ maxWidth: 600 }}
                onChange={(e) => {
                  setNewNet(e.target.value);
                  if (netError) setNetError("");
                }}
                error={Boolean(netError)}
                helperText={
                  netError || "ASCII characters only, max. 99 characters"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNet();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddNet}
                sx={{
                  height: { xs: "auto", sm: "56px" },
                }}
              >
                Add
              </Button>
            </Stack>

            {/* Popular groups */}
            <Stack spacing={0.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  py: 1,
                }}
              >
                {Object.entries(POPULAR_GROUPS).map(([key, _]) => {
                  const handleClick = () =>
                    addGroup(key as keyof typeof POPULAR_GROUPS);
                  return (
                    <Button
                      key={key}
                      variant="outlined"
                      size="small"
                      onClick={handleClick}
                      endIcon={<AddIcon fontSize="small" />}
                      sx={{
                        textTransform: "none",
                        borderRadius: 1,
                        px: 1.25,
                        py: 0.5,
                        lineHeight: 1.5,
                        height: 32,
                      }}
                    >
                      {key}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>

            {/* Render each net name as a small card with delete */}
            <Stack spacing={0.5} sx={{ pt: 1 }}>
              {netNames.map((name) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Chip
                    label={name}
                    sx={{
                      fontSize: "1rem",
                      height: 32,
                      px: 2,
                      fontFamily: "monospace",
                    }}
                  />
                  <Tooltip title={`Delete "${name}" socket`} arrow>
                    <IconButton
                      aria-label={`delete ${name}`}
                      onClick={() => handleDeleteNet(name)}
                      sx={{ color: "error.main" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
          </Stack>

          {/* Advanced options toggle */}
          <Stack spacing={1}>
            <Button
              variant="text"
              endIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setAdvancedOpen((o) => !o)}
            >
              Advanced options
            </Button>

            <Collapse in={advancedOpen} timeout="auto" unmountOnExit>
              <Stack spacing={2}>
                {/* Crosshair Layer */}
                <FormControl>
                  <FormLabel>Crosshair layer</FormLabel>
                  <Select
                    value={crosshairLayer}
                    onChange={(e) =>
                      setCrosshairLayer(e.target.value as CrosshairLayer)
                    }
                  >
                    <MenuItem value="F.Fab">F.Fab</MenuItem>
                    <MenuItem value="User.Drawing">User.Drawing</MenuItem>
                  </Select>
                </FormControl>

                {/* Sockets Layer - not needed at the moment, will default to User.1 layer */}
                {/* <FormControl>
                  <FormLabel>Sockets layer</FormLabel>
                  <Select
                    value={socketsLayer}
                    onChange={(e) =>
                      setSocketsLayer(e.target.value as SocketsLayer)
                    }
                  >
                    <MenuItem value="User.1">User.1</MenuItem>
                    <MenuItem value="GerberSockets">GerberSockets</MenuItem>
                  </Select>
                </FormControl> */}

                {/* Copper Pad Diameter */}
                <FormControl>
                  <FormLabel>Copper pad diameter</FormLabel>
                  <OutlinedInput
                    type="number"
                    inputProps={{ step: 0.005, min: 0.05 }}
                    value={
                      Number.isNaN(copperPadDiameter) ? "" : copperPadDiameter
                    }
                    onChange={(e) =>
                      setCopperPadDiameter(
                        e.target.value === "" ? NaN : Number(e.target.value)
                      )
                    }
                    endAdornment={
                      <InputAdornment position="end">mm</InputAdornment>
                    }
                  />
                </FormControl>
              </Stack>
            </Collapse>
          </Stack>

          {/* Download button */}
          <Box sx={{ pt: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                variant="contained"
                color="primary"
                disabled={netNames.length === 0}
                onClick={handleDownload}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Download
              </Button>
              <Box sx={{ color: "text.secondary" }}>
                Downloads ZIP file containing EDA library files,&nbsp;
                <a
                  href="https://github.com/mac-aron/generate-GerberSockets/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  read more here
                </a>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </>
  );
}
