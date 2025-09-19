import { Box, Typography } from "@mui/material";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        mt: "auto",
        textAlign: "center",
      }}
    >
      <Typography variant="body2">
        &copy; {currentYear} Lancaster University
      </Typography>
    </Box>
  );
}

export default Footer;
