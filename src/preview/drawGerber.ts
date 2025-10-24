import type { Gerber, GerberSet } from "./parseGerber";
import type { GerberSocket } from "./parseSockets";

// Drawing parameters
const canvasDPI = 2;
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
        ctx.stroke();
        lastCoord = { x: px, y: py };
      }

      if (item.op === "flash" && currentTool) {
        ctx.beginPath();
        const radius = ((currentTool.params?.[0] || 0.2) * scale) / 2;
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fillStyle = drawColor;
        ctx.fill();
      }
    }
  }
};

const drawGerberSocket = (socket: GerberSocket, canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get canvas 2D context.");
    return;
  }

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

  ctx.font = "32px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "black";
  ctx.fillText(socket.ascii, px + 20, py);
};

export const drawGerberCanvas = (
  gerberSet: GerberSet,
  sockets: GerberSocket[],
  canvas: HTMLCanvasElement
) => {
  console.log("Drawing Gerber Layers:", gerberSet.gerbers);

  // Set scale depending on gerber size
  // Find max and min coordinates
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const gerber of gerberSet.gerbers) {
    for (const item of gerber.graphicObjects) {
      if (item.type === "op") {
        const { x, y } = item.coord;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const gerberWidth = maxX - minX;
  const gerberHeight = maxY - minY;
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / gerberWidth;
  const scaleY = canvasRect.height / gerberHeight;
  scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
  scale *= canvasDPI;

  initCanvas(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get canvas 2D context.");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw gerber layers
  for (const gerber of gerberSet.gerbers) {
    drawGerberLayer(gerber, canvas, gerberSet.gerbers.indexOf(gerber));
  }

  // Overlay semi-transparent white to fade layers
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw sockets ontop
  for (const socket of sockets) {
    drawGerberSocket(socket, canvas);
  }
};
