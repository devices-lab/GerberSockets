// NOTE: AI generated
import { useRef, useState } from "react";
import { Box } from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";

type FileUploadDropZoneProps = {
  onFileDrop: (file: File) => void;
  message?: string;
  accept?: string;
};

export default function FileUploadDropZone({
  onFileDrop,
  accept,
}: FileUploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
  };

  return (
    <Box
      onClick={handleClick}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      sx={{
        border: "2px dashed",
        borderColor: isDragging ? "primary.dark" : "divider",
        borderRadius: 1,
        padding: 6,
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        textAlign: "center",
        backgroundColor: isDragging ? "action.hover" : "transparent",
        transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "action.hover",
          borderColor: "primary.main",
        },
      }}
    >
      <FileUploadIcon 
        sx={{ 
          fontSize: 64, 
          color: isHovering || isDragging ? "primary.dark" : "primary.main",
          transition: "color 0.2s ease-in-out",
        }} 
      />
      <Box sx={{ color: "text.secondary" }}>
        Accepts ZIP file or any Gerber files
      </Box>

      <input
        type="file"
        accept={accept}
        hidden
        ref={inputRef}
        onChange={handleFileSelect}
      />
    </Box>
  );
}