import type { GerberSocket } from "./parseSockets";

export const GRID_DIVISION = 0.25; // mm

// Check if a coordinate is on the grid
export const isOnGrid = (value: number, gridDivision: number): boolean => {
  const remainder = Math.abs(value % gridDivision);
  // Account for floating point precision issues
  return remainder < 0.0001 || Math.abs(remainder - gridDivision) < 0.0001;
};

// Check if all sockets are on grid
export const checkGridAlignment = (
  sockets: GerberSocket[],
  gridDivision: number = GRID_DIVISION
): boolean => {
  return sockets.every(
    (socket) =>
      isOnGrid(socket.x, gridDivision) && isOnGrid(socket.y, gridDivision)
  );
};

// Get sockets that are not on grid
export const getOffGridSockets = (
  sockets: GerberSocket[],
  gridDivision: number = GRID_DIVISION
): GerberSocket[] => {
  return sockets.filter(
    (socket) =>
      !isOnGrid(socket.x, gridDivision) || !isOnGrid(socket.y, gridDivision)
  );
};
