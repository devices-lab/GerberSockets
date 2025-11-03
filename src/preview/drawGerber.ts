import type { Gerber, GerberSet } from "./parseGerber";
import type { GerberSocket } from "./parseSockets";

// Drawing parameters
export const canvasDPI = 2;
let scale: number;
let offsetX: number;
let offsetY: number;

const initCanvas = (canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * canvasDPI; // Times two for a higher DPI
  canvas.height = rect.height * canvasDPI;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  offsetX = canvas.width / 2;
  offsetY = canvas.height / 2;
};

export const clearCanvas = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

type Coord = { x: number; y: number };
type Tool = { shape: string; params: number[] };

// Draw each Gerber layer
// NOTE: Mostly AI generated function, haven't looked at it properly yet
// BUG: This is quite a primitive rendering, doesn't handle arcs, polygons, fills, etc,
// but should be enough to understand the socket placements relative to the PCB.
const drawGerberLayer = (
  gerber: Gerber,
  canvas: HTMLCanvasElement,
  layerNumber = 0
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get canvas 2D context.");
    return;
  }

  const drawColor = "hsl(" + ((layerNumber * 67) % 360) + ", 70%, 50%)";

  const tools: Record<string, Tool> = {};
  let currentTool: Tool | null = null;
  let lastCoord: Coord | null = null;

  for (const item of gerber.graphicObjects) {
    if (item.type === "tool") {
      tools[item.code] = item.tool;
    }

    if (item.type === "set" && item.prop === "tool") {
      currentTool = tools[item.value];
    }

    if (item.type === "op") {
      const { x, y } = item.coord;
      const px = offsetX + x * scale;
      const py = offsetY - y * scale;

      if (item.op === "move") {
        lastCoord = { x: px, y: py };
      }

      if (item.op === "int" && lastCoord && currentTool) {
        ctx.beginPath();
        ctx.moveTo(lastCoord.x, lastCoord.y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = (currentTool.params?.[0] || 0.2) * scale;
        if (ctx.lineWidth > canvas.width / 3) {
          // Too big, skip drawing (probably an error in the parsing)
          console.warn('Skipping line drawing due to excessive line width:', ctx.lineWidth);
          lastCoord = { x: px, y: py };
          continue;
        }
        // console.log('Drawing line from:', lastCoord, 'to:', { x: px, y: py }, 'with tool:', currentTool, 'line width:', ctx.lineWidth, 'canvas width:', canvas.width, 'height:', canvas.height);
        ctx.stroke();
        lastCoord = { x: px, y: py };
      }

      if (item.op === "flash" && currentTool) {
        ctx.beginPath();
        const radius = (currentTool.params?.[0] || 0.2) * scale / 2;
        if (radius > canvas.width / 3) {
          // Too big, skip drawing (probably an error in the parsing)
          console.warn('Skipping flash drawing due to excessive radius:', radius);
          continue;
        }
        // console.log('Flashing at:', px, py, 'with tool:', currentTool, 'radius:', radius, 'canvas width:', canvas.width, 'height:', canvas.height);
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fillStyle = drawColor;
        ctx.fill();
      }
    }
  }
};

// Mutate sockets within array to add canvas positions
const assignCanvasPosToSockets = (sockets: GerberSocket[]) => {
  for (let i = 0; i < sockets.length; i++) {
    const socket = sockets[i];

    sockets[i].canvasX = offsetX + socket.x * scale;
    sockets[i].canvasY = offsetY - socket.y * scale;
  }
}

const drawGerberSocket = (socket: GerberSocket, canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw ("Failed to get canvas 2D context.");

  const px = offsetX + socket.x * scale;
  const py = offsetY - socket.y * scale;

  const radius = 10;
  // Circle
  // ctx.beginPath();
  // ctx.arc(px, py, radius, 0, 2 * Math.PI);
  // ctx.fillStyle = 'black';
  // ctx.fill();

  // Diagonal cross
  ctx.beginPath();
  ctx.moveTo(px - radius, py - radius);
  ctx.lineTo(px + radius, py + radius);
  ctx.moveTo(px + radius, py - radius);
  ctx.lineTo(px - radius, py + radius);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.stroke();

  // ASCII Text
  // ctx.font = "32px Arial";
  // ctx.textAlign = "left";
  // ctx.textBaseline = "middle";
  // ctx.fillStyle = "black";
  // ctx.fillText(socket.ascii, px + 20, py);
};

export const drawStackup = (
  stackup: any,
  canvas: HTMLCanvasElement
) => {
  // Draw stackup.top.svg with the correct scale and offset
  const ctx = canvas.getContext("2d");
  if (!ctx) throw ("Failed to get canvas 2D context.");

  const svgData = stackup.top.svg;
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw SVG centered with scale
    const svgScaleDiff = 3.8; // TODO: Figure out / eliminate this magic number
    const imgWidth = img.width / svgScaleDiff * scale;
    const imgHeight = img.height / svgScaleDiff * scale;
    const drawX = offsetX - imgWidth / 2;
    const drawY = offsetY - imgHeight / 2;

    ctx.drawImage(img, drawX, drawY, imgWidth, imgHeight);

    URL.revokeObjectURL(url);

  };
  img.src = url;
};

export const drawGerber = (
  gerberSet: GerberSet,
  sockets: GerberSocket[],
  canvas: HTMLCanvasElement
) => {
  console.log("Drawing Gerber Layers:", gerberSet.gerbers);

  // Check if there's an edge cuts layer
  const edgeCutsLayer = gerberSet.gerbers.find(gerber =>
    gerber.filename.toLowerCase().includes('edge') &&
    gerber.filename.toLowerCase().includes('cuts') &&
    gerber.graphicObjects.length > 4
  );

  // Find bounds of all gerber layers
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let avgX = 0, avgY = 0, pointCount = 0;

  for (const gerber of gerberSet.gerbers) {
    // If edge cuts layer exists, use only it when calculating bounds
    if (edgeCutsLayer && gerber !== edgeCutsLayer) continue;

    for (const item of gerber.graphicObjects) {
      if (item.type === "op") {
        const { x, y } = item.coord;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        avgX += x;
        avgY += y;
        pointCount++;
      }
    }
  }
  avgX /= pointCount;
  avgY /= pointCount;
  console.log('Gerber bounds:', { minX, minY, maxX, maxY });
  // Set scale to fit gerber in canvas
  const gerberWidth = maxX - minX;
  const gerberHeight = maxY - minY;
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / gerberWidth;
  const scaleY = canvasRect.height / gerberHeight;
  scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
  scale *= canvasDPI;

  initCanvas(canvas); // Sets offsetX/Y

  // Convert avg to canvas offset
  avgX = offsetX - avgX * scale;
  avgY = offsetY + avgY * scale;

  // If the current offset is very different from the average object coordinate, use the 
  // average offset since the gerber is probably off-screen
  if (Math.abs(offsetX - avgX) + Math.abs(offsetY - avgY) > canvas.width / 2) {
    offsetX = avgX;
    offsetY = avgY;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw ("Failed to get canvas 2D context.");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw gerber layers
  for (const gerber of gerberSet.gerbers) {
    drawGerberLayer(gerber, canvas, gerberSet.gerbers.indexOf(gerber));
  }

  // Overlay semi-transparent white to fade layers
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set canvas positions of sockets
  assignCanvasPosToSockets(sockets);
  for (const socket of sockets) {
    drawGerberSocket(socket, canvas);
  }
};
