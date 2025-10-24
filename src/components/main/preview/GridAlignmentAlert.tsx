import { Alert, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import type { GerberSocket } from "../../../preview/parseSockets";
import {
  checkGridAlignment,
  getOffGridSockets,
  GRID_DIVISION,
} from "../../../preview/gridValidation";

interface GridAlignmentAlertProps {
  sockets: GerberSocket[];
}

export default function GridAlignmentAlert({
  sockets,
}: GridAlignmentAlertProps) {
  if (sockets.length === 0) return null;

  const allSocketsOnGrid = checkGridAlignment(sockets);
  const offGridSockets = getOffGridSockets(sockets);

  return (
    <Alert
      severity={allSocketsOnGrid ? "success" : "warning"}
      icon={allSocketsOnGrid ? <CheckCircleIcon /> : <WarningIcon />}
      sx={{ mb: 2 }}
    >
      {allSocketsOnGrid ? (
        <Typography variant="body2">
          All {sockets.length} socket(s) are aligned to the {GRID_DIVISION} mm
          grid
        </Typography>
      ) : (
        <Typography variant="body2">
          {offGridSockets.length} socket(s) are not aligned to the{" "}
          {GRID_DIVISION} mm grid
        </Typography>
      )}
    </Alert>
  );
}
