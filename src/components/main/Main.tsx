import React, { useState, KeyboardEvent } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
} from "@mui/material";
import { Delete, Download, Add } from "@mui/icons-material";
import AlphanumericField from "./AlphanumericField";

interface NetItem {
  id: string;
  name: string;
}

const Main: React.FC = () => {
  const [netName, setNetName] = useState<string>("");
  const [netItems, setNetItems] = useState<NetItem[]>([]);

  const addNetName = () => {
    if (netName.trim()) {
      const newItem: NetItem = {
        id: Date.now().toString(),
        name: netName.trim(),
      };
      setNetItems((prev) => [...prev, newItem]);
      setNetName("");
    }
  };

  const removeNetItem = (id: string) => {
    setNetItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      addNetName();
    }
  };

  const handleDownload = () => {
    console.log("Download triggered for items:", netItems);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">Add your net names</Typography>

      <AlphanumericField
        autoFocus
        margin="dense"
        id="netName"
        label="Net name"
        type="text"
        fullWidth
        variant="outlined"
        value={netName}
        onChange={addNetName}
        // onKeyPress={handleKeyPress}
      />
      <Button variant="contained" onClick={addNetName} startIcon={<Add />}>
        Add
      </Button>

      {/* Cards
      <Grid container spacing={2} sx={{ marginBottom: 3 }}>
        {netItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body1">{item.name}</Typography>
                <IconButton
                  color="error"
                  onClick={() => removeNetItem(item.id)}
                  size="small"
                >
                  <Delete />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid> */}

      <Button
        variant="contained"
        color="primary"
        onClick={handleDownload}
        startIcon={<Download />}
        disabled={netItems.length === 0}
      >
        Download
      </Button>
    </Box>
  );
};

export default Main;
