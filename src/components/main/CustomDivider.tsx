import React from "react";
import { Box, Typography, Divider } from "@mui/material";

interface CustomDividerProps {
  name: string;
}

const CustomDivider: React.FC<CustomDividerProps> = ({ name }) => {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          mx: "max",
        }}
      >
        <Typography variant="h6">{name}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
    </>
  );
};

export default CustomDivider;
