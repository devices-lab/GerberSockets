import React, { useState, useEffect } from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface AlphanumericFieldProps extends Omit<TextFieldProps, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  showErrorMessage?: boolean;
}

const AlphanumericField: React.FC<AlphanumericFieldProps> = ({
  value,
  onChange,
  showErrorMessage = true,
  ...textFieldProps
}) => {
  const [error, setError] = useState<string>("");

  // Reset error state when value changes externally (like when reverting to previous value)
  useEffect(() => {
    // Check if current value is valid
    if (value === "" || /^[a-zA-Z0-9_-]+$/.test(value)) {
      setError("");
    }
  }, [value]);

  // Fixed validation regex for alphanumeric, hyphens, and underscores
  const validRegex = /^[a-zA-Z0-9_-]+$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue === "" || validRegex.test(newValue)) {
      setError("");
    } else {
      setError(
        "Only letters, numbers, hyphens (-) and underscores (_) are allowed"
      );
    }

    onChange(newValue);
  };

  return (
    <TextField
      autoComplete="off"
      {...textFieldProps}
      value={value}
      onChange={handleChange}
      error={!!error}
      helperText={showErrorMessage ? error : null}
    />
  );
};

export default AlphanumericField;
