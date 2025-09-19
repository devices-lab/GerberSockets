import { Box } from "@mui/material";
import Topbar from "./components/Header";
import Footer from "./components/Footer";
import Main from "./components/main/Main";

// Separate component to use the context after it's been provided
function AppContent() {
  return (
    <Box display="flex" flexDirection="column" sx={{ height: "100vh" }}>
      <Topbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          userSelect: "none", // Disable text selection globally
        }}
      >
        <Main />
      </Box>
      <Footer />
    </Box>
  );
}

export default function App() {
  return <AppContent />;
}
