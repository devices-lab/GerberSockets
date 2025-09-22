import { Fragment } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import logo from "../assets/sockets.svg"; // Import the SVG logo

function Topbar() {
  return (
    <Fragment>
      <AppBar position="fixed">
        <Toolbar>
          {/* Logo and Title as Button */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              paddingLeft: 1,
              paddingRight: 2,
              borderRadius: 1,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="MakeDevice Logo"
              sx={{
                width: 32,
                height: 32,
                mr: 2,
                filter: "brightness(0) invert(1)", // This makes the SVG white
              }}
            />

            <Typography fontWeight="bold" variant="h5">
              GerberSockets
            </Typography>
            <Chip
              label="ALPHA"
              size="small"
              color="warning"
              sx={{
                ml: 2,
                height: "25px",
                fontWeight: "bold",
              }}
            />
          </Box>

          {/* Right side icons */}
          <Box
            sx={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
          >
            {/* GitHub link */}
            <Tooltip title="GitHub">
              <IconButton
                component="a"
                href="https://github.com/mac-aron/generate-GerberSockets"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </Fragment>
  );
}

export default Topbar;
