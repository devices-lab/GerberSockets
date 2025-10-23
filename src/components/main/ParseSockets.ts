import type { Gerber, GerberSet } from './ParseGerber';

export interface GerberSocket {
  ascii: string;
  x: number;
  y: number; 
}

export interface GerberKeepoutZone {
  // TODO:
}

/*
   NOTE: Comment copied from the backend

  Extracts socket locations from Gerber objects using encoded ASCII identifiers.

  This method scans the loaded Gerber data for zero-length lines (interpreted as "circles")
  with specific aperture diameters that encode ASCII characters. It decodes these diameters
  to reconstruct net names and associates each net name with its corresponding (x, y) position.

  Notes:
      - The encoding expects diameters in the format "0.iippp", where 'ii' is an index and 'ppp'
        is the ASCII code of the character.
      - Only diameters matching the expected format and value ranges are decoded.
*/
export const parseSockets = (gerberSet: GerberSet): GerberSocket[] => {
  // Find the GerberSockets layer
  let socketGerberLayer = null;
  for (const gerber of gerberSet.gerbers) {
    if (gerber.filename.endsWith('.gbr') && gerber.filename.includes('GerberSockets')) {
      socketGerberLayer = gerber;
      break;
    }
  }
  if (!socketGerberLayer) {
    alert('Error: No GerberSockets layer found in the uploaded gerber files.');
    return [];
  }

  const sockets: GerberSocket[] = [];

  console.log('Gerber socket layer graphicObjects', socketGerberLayer.graphicObjects);

  // Example JSON structure of a gerber socket in graphicObjects:
  // Tool creation example:
    // {
    //     "type": "tool",
    //     "line": 14,
    //     "code": "12",
    //     "tool": {
    //         "shape": "circle",
    //         "params": [
    //             0.01083
    //         ],
    //         "hole": []
    //     }
    // },
    //
  // Tool use example (I think?):
    // {
    //     "type": "set",
    //     "line": 102,
    //     "prop": "tool",
    //     "value": "12"
    // },
    // {
    //     "type": "op",
    //     "line": 103,
    //     "op": "move",
    //     "coord": {
    //         "x": -6.5,
    //         "y": 8.25
    //     }
    // },
    // {
    //     "type": "op",
    //     "line": 104,
    //     "op": "int",
    //     "coord": {
    //         "x": -6.5,
    //         "y": 8.25
    //     }
    // },

  // Python code reference:
    // # 1–2. Collect zero-length lines as “circles”
    // circles = defaultdict(list)  # (x, y) -> List[float diameter]
    // for obj in self.gerber.objects:
    //     if isinstance(obj, Line) and obj.x1 == obj.x2 and obj.y1 == obj.y2:
    //         ap = getattr(obj, "aperture", None)
    //         d = getattr(ap, "diameter", None)
    //         if d is not None:
    //             # Optional: quantize to avoid float-key fragmentation
    //             pos = (obj.x1, obj.y1)
    //             circles[pos].append(float(d))

  // NOTE:  hmm, seems we have a different format to the backend... no apeture or diameter here?

  // Find zero-length lines as "circles"
  const circles: Record<string, { x: number; y: number; diameters: number[] }> = {};

  // NOTE: AI generated circle finding code, needs checking and fixing
  for (const obj of socketGerberLayer.graphicObjects) {
    if (obj.type === 'op' && obj.op === 'int') {
      const { x, y } = obj.coord;

      // Check if previous op was a move to the same coord (zero-length line)
      const prevIndex = socketGerberLayer.graphicObjects.indexOf(obj) - 1;
      if (prevIndex >= 0) {
        const prevObj = socketGerberLayer.graphicObjects[prevIndex];
        if (prevObj.type === 'op' && prevObj.op === 'move') {
          const { x: px, y: py } = prevObj.coord;
          if (x === px && y === py) {
            // Zero-length line found
            // Find the current tool to get diameter
            let toolCode = null;
            for (let i = prevIndex; i >= 0; i--) {
              const lookbackObj = socketGerberLayer.graphicObjects[i];
              if (lookbackObj.type === 'set' && lookbackObj.prop === 'tool') {
                toolCode = lookbackObj.value;
                break;
              }
            }
            if (toolCode) {
              // Find tool definition
              for (const lookbackObj of socketGerberLayer.graphicObjects) {
                if (lookbackObj.type === 'tool' && lookbackObj.code === toolCode) {
                  const diameter = lookbackObj.tool.params?.[0];
                  if (typeof diameter === 'number') {
                    const key = `${x},${y}`;
                    if (!circles[key]) {
                      circles[key] = { x, y, diameters: [] };
                    }
                    circles[key].diameters.push(diameter);
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('Circles found:', circles);

  // For now just say anything in the circles is a socket (NOTE: also AI generated)
  for (const key in circles) {
    const circle = circles[key];
    // Decode ASCII from diameters
    let ascii = '';
    for (const diameter of circle.diameters) {
      const diameterStr = diameter.toFixed(5); // Ensure consistent decimal places
      const match = diameterStr.match(/^0\.(\d{2})(\d{3})$/);
      if (match) {
        const asciiCode = parseInt(match[2], 10);
        if (asciiCode >= 32 && asciiCode <= 126) { // Printable ASCII range
          ascii += String.fromCharCode(asciiCode);
        }
      }
    }
    if (ascii) {
      sockets.push({ ascii, x: circle.x, y: circle.y });
    }
  }
  
  return sockets;
}
