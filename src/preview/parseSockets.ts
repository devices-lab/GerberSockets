import type { GerberSet } from "./parseGerber";
import type { Dispatch, SetStateAction } from "react";
import type { Gerber } from "./parseGerber";

export interface GerberSocket {
  ascii: string;
  x: number;
  y: number;
  diameters?: number[]; // For showing info on legacy sockets without ASCII
  canvasX?: number; // Canvas position X (added later)
  canvasY?: number; // Canvas position Y (added later)
}

export interface GerberKeepoutZone {
  // TODO:
}

/*
  Extracts socket locations from Gerber objects using encoded ASCII identifiers.

  This method scans the loaded Gerber data for zero-length lines (interpreted as "circles")
  with specific aperture diameters that encode ASCII characters. It decodes these diameters
  to reconstruct net names and associates each net name with its corresponding (x, y) position.

  Notes:
      - The encoding expects diameters in the format "0.iippp", where 'ii' is an index and 'ppp'
        is the ASCII code of the character.
      - Only diameters matching the expected format and value ranges are decoded.
*/

// Example JSON structure of a gerber socket in graphicObjects:
// Tool creation example:
// {
//     "type": "tool",
//     "line": 14,
//     "code": "12", <-- The tool number
//     "tool": {
//         "shape": "circle",
//         "params": [
//             0.01083 <-- Defines the diameter of this tool
//         ],
//         "hole": []
//     }
// },
//
// Tool use example:
// {
//     "type": "set", <-- Sets the current tool
//     "line": 102,
//     "prop": "tool",
//     "value": "12" <-- The tool number being used
// },
// {
//     "type": "op",
//     "line": 103,
//     "op": "move", <-- Move to position without drawing
//     "coord": {
//         "x": -6.5,
//         "y": 8.25
//     }
// },
// {
//     "type": "op",
//     "line": 104,
//     "op": "int", <-- Interpolate (draw) to position
//     "coord": {
//         "x": -6.5, <-- Same position = zero-length line
//         "y": 8.25
//     }
// },

// Find zero-length lines as "circles"
const findCircles = (socketGerberLayer: Gerber): Record<string, { x: number; y: number; diameters: number[] }> => {
  const DEBUG = false;

  type Coord = { x: number; y: number };
  type Tool = { shape: string; params: number[] };

  const tools: Record<string, Tool> = {};
  let currentTool: Tool | null = null;
  let lastCoord: Coord | null = null;

  const circles: Record<string, { x: number; y: number; diameters: number[] }> = {};

  // Circle finding code
  for (const item of socketGerberLayer.graphicObjects) {
    if (item.type === "tool") {
      tools[item.code] = item.tool;
      if (DEBUG)
        console.log(`Tool created: code=${item.code}, diameter=${item.tool.params?.[0]} line=${item.line}`);
    }

    if (item.type === "set" && item.prop === "tool") {
      currentTool = tools[item.value];
      if (DEBUG)
        console.log(`Current tool set to code=${item.value}, diameter=${currentTool?.params?.[0]} line=${item.line}`);
    }

    if (item.type === "op") {
      const { x, y } = item.coord;

      if (item.op === "move") {
        lastCoord = { x, y };
        if (DEBUG) console.log(`Move to: (${x}, ${y})`, `line=${item.line}`);
      }

      if (item.op === "int" && lastCoord && currentTool) {
        if (DEBUG)
          console.log(
            `Interpolate to: (${x}, ${y}) from (${lastCoord.x}, ${lastCoord.y}) with tool code=${Object.keys(tools).find((key) => tools[key] === currentTool)
            }, line=${item.line}`
          );

        // Check for zero-length line
        if (x === lastCoord.x && y === lastCoord.y) {
          const diameter = currentTool.params?.[0] || 0;
          const key = `${x.toFixed(5)},${y.toFixed(5)}`;
          if (!circles[key]) {
            circles[key] = { x, y, diameters: [] };
          }
          circles[key].diameters.push(diameter);
          if (DEBUG)
            console.log(`  Zero-length line (circle) found at (${x}, ${y}) with diameter: ${diameter}`);
        }

        lastCoord = { x, y };
      }
    }
  }

  return circles;
}

const circlesToSockets = (
  circles: Record<string, { x: number; y: number; diameters: number[] }>,
  setStatusMessage: Dispatch<SetStateAction<string | null>>,
  setStatusSeverity: Dispatch<SetStateAction<"error" | "warning" | "info" | "success">>
): GerberSocket[] => {
  let sockets: GerberSocket[] = [];

  let asciiMissingCount = 0;
  let identifiersFound = 0;
  let overlappingLocations: Record<string, boolean> = {};
  for (const key in circles) {
    const circle = circles[key];
    // Decode ASCII from diameters
    let ascii = [];
    let hasIdentifier = false;
    let localIdentifiersFound = 0;
    for (const diameter of circle.diameters) {
      const diameterStr = diameter.toFixed(5); // Ensure consistent decimal places
      const match = diameterStr.match(/^0\.(\d{2})(\d{3})$/);
      if (match) {
        if (match[1] === "00" && match[2] === "999") {
          hasIdentifier = true;
          identifiersFound++;
          localIdentifiersFound++;

          if (localIdentifiersFound > 1) {
            overlappingLocations[key] = true;
            console.warn(
              `Overlapping identifier circles found at (${circle.x}, ${circle.y}).`
            );
          }
          continue; // Identifier circle, skip
        }
        const index = parseInt(match[1], 10);
        const asciiCode = parseInt(match[2], 10);
        if (asciiCode >= 32 && asciiCode <= 126) {
          // Printable ASCII range
          if (ascii[index]) {
            overlappingLocations[key] = true;
            console.warn(
              `Duplicate ASCII index ${index} at (${circle.x}, ${circle.y}). Overwriting previous character.`
            );
          }
          ascii[index] = String.fromCharCode(asciiCode);
        }
      }
    }

    const asciiStr = ascii.join("");

    // ASCII Socket must have identifier circle
    if (!hasIdentifier) continue;

    // Only add socket if we decoded some ASCII
    if (asciiStr) {
      sockets.push({ ascii: asciiStr, x: circle.x, y: circle.y } as GerberSocket);
    } else {
      asciiMissingCount++;
      console.warn(
        `Missing ASCII data for GerberSocket at (${circle.x}, ${circle.y}).`
      );
      sockets.push({ ascii: "", x: circle.x, y: circle.y } as GerberSocket);
    }
  }

  if (asciiMissingCount) {
    setStatusMessage(
      `${asciiMissingCount} GerberSocket(s) were missing ASCII data`
    );
    setStatusSeverity("warning");
  }

  // If no ASCII identifiers found, show all circles as legacy sockets
  if (identifiersFound === 0 && Object.keys(circles).length > 0) {
    setStatusMessage("No ASCII GerberSocket identifiers were found, showing legacy sockets instead");
    setStatusSeverity("warning");

    // Display all circles as sockets without ASCII
    sockets = [];
    for (const key in circles) {
      const circle = circles[key];
      sockets.push({
        ascii: "",
        x: circle.x,
        y: circle.y,
        diameters: circle.diameters,
      } as GerberSocket);
    }
  }

  if (Object.keys(overlappingLocations).length > 0) {
    setStatusMessage(
      `${Object.keys(overlappingLocations).length} locations have overlapping GerberSocket data`
    );
    console.log("Overlapping locations:", Object.keys(overlappingLocations));
    setStatusSeverity("warning");
  }

  // Sort sockets from top-left to bottom-right
  sockets.sort((a, b) => {
    if (a.y !== b.y) return b.y - a.y;
    return a.x - b.x;
  });

  return sockets;
}

const KNOWN_SOCKET_LAYER = true;

export const parseSockets = (
  gerberSet: GerberSet,
  setStatusMessage: Dispatch<SetStateAction<string | null>>,
  setStatusSeverity: Dispatch<
    SetStateAction<"error" | "warning" | "info" | "success">
  >
): GerberSocket[] => {
  if (KNOWN_SOCKET_LAYER) {
    // Add sockets from GerberSockets named layer only

    // Find the GerberSockets layer
    let socketGerberLayer = null;
    for (const gerber of gerberSet.gerbers) {
      if (
        gerber.filename.toLowerCase().endsWith(".gbr") &&
        gerber.filename.includes("GerberSockets")
      ) {
        socketGerberLayer = gerber;
        break;
      }
    }
    if (!socketGerberLayer) {
      setStatusMessage(
        "No GerberSockets layer found in the uploaded gerber files"
      );
      setStatusSeverity("error");
      return [];
    }

    console.log(
      `graphicObjects of layer '${socketGerberLayer.filename}'`,
      socketGerberLayer.graphicObjects
    );

    const circles = findCircles(socketGerberLayer);
    console.log("Circles (zero-length lines) found:", circles);

    const sockets = circlesToSockets(circles, setStatusMessage, setStatusSeverity);
    console.log("Parsed sockets:", sockets);

    return sockets;
  } else {
    // Add sockets from all layers

    // Build the sockets array by checking all layers
    let allCircles: Record<string, { x: number; y: number; diameters: number[] }> = {};
    for (const gerber of gerberSet.gerbers) {
      console.log(
        `graphicObjects of layer '${gerber.filename}'`,
        gerber.graphicObjects
      );
      try {
        const circles = findCircles(gerber);
        if (Object.keys(circles).length > 0) {
          console.log(`Circles (zero-length lines) found in layer '${gerber.filename}':`, circles);
        }
        allCircles = { ...allCircles, ...circles };
      } catch (e) {
        console.error(`Error parsing circles from layer '${gerber.filename}':`, e);
      }
    }
    console.log("Circles (zero-length lines) found in all layers:", allCircles);
    const sockets = circlesToSockets(allCircles, setStatusMessage, setStatusSeverity);
    console.log("Parsed sockets from all layers:", sockets);
    return sockets;
  }
};
