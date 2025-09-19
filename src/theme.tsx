import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// A custom theme for this app
const theme = createTheme({
  typography:{
    fontFamily: 'Roboto, sans-serif',
  },
  cssVariables: true,
  palette: {
    primary: {
      main: "#046307",
    },
    secondary: {
      main: "#094D1C",
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;