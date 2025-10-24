// NOTE: AI generated
import { Box, Tooltip, Typography } from "@mui/material";
import { canvasDPI } from "../../../preview/drawGerber";

export interface GerberSocketChipProps {
  canvasX: number;
  canvasY: number;
  ascii?: string;
}

export const GerberSocketChip = ({ canvasX, canvasY, ascii }: GerberSocketChipProps) => {
  const size = 32 / canvasDPI;

  return (
    <Box
      sx={{
        position: "absolute",
        top: canvasY / canvasDPI,
        left: canvasX / canvasDPI,
        transform: "translate(-50%, -50%)",
        pointerEvents: "auto",
      }}
    >
      <Tooltip
        title={
          <Typography
            sx={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              px: 0.5,
              py: 0.25,
            }}
          >
            {ascii || "N/A"}
          </Typography>
        }
        placement="top"
        arrow
      >
        {/* Outer wrapper handles consistent hover scale */}
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            transition: "transform 0.18s ease, opacity 0.18s ease",
            "&:hover": {
              transform: "scale(1.5)",
              opacity: 1,
              zIndex: 10,
              cursor: "pointer",
            },
          }}
        >
          {/* Inner pulsing element — animation continues, but its transform is overridden on hover */}
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: ascii ? "primary.main" : "warning.main",
              opacity: 0.5,
              // pulse animates transform + opacity so it visually pulses
              animation: "pulse 2000ms infinite linear",
              // ensure transform changes from animation are overridden on hover
              "&:hover": {
                transform: "none !important",
              },
              // keyframes for the pulse
              "@keyframes pulse": {
                "0%": { transform: "scale(1)", opacity: 0.5 },
                "50%": { transform: "scale(1.12)", opacity: 0.75 },
                "100%": { transform: "scale(1)", opacity: 0.5 },
              },
            }}
          />
        </Box>
      </Tooltip>
    </Box>
  );
};
