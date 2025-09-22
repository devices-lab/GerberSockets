import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// A custom theme for this app
const theme = createTheme({
  cssVariables: false,

  palette: {
    primary: {
      main: "#046307", // MakeDevice green primary
      // main: "#070463",
    },
    secondary: {
      main: "#094D1C", // MakeDevice green secondary
      // main: "#0A0694",
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
