import React, { useState } from "react";
import { Box, Stack, Tabs, Tab, useMediaQuery, useTheme } from "@mui/material";
import ViewSection from "./ViewSection";
import GenerateSection from "./GenerateSection";

const Main: React.FC = () => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("md"));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {isLargeScreen ? (
        // Side-by-side layout for larger screens
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={6}>
            <Box flex={1}>
              <GenerateSection />
            </Box>
            <Box flex={1}>
              <ViewSection />
            </Box>
          </Stack>
        </Box>
      ) : (
        // Tabbed layout for smaller screens
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Generate" />
            <Tab label="Preview" />
          </Tabs>
          <Box sx={{ px: 2 }}>
            {activeTab === 0 && <GenerateSection />}
            {activeTab === 1 && <ViewSection />}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Main;
