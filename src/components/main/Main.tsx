import React from "react";
import {
  Box,
  Stack,
} from "@mui/material";
import ViewSection from "./ViewSection";
import GenerateSection from "./GenerateSection";

const Main: React.FC = () => {

  return (
    <Box sx={{ p: 2 }}>
      {/* Two horizontal sections: Generate and View */}
      <Stack direction="row" spacing={6}>
        <Box flex={1}>
          <GenerateSection />
        </Box>
        <Box flex={0.7}>
          <ViewSection />
        </Box>
      </Stack>
    </Box>
  );
};

export default Main;
