import type { Gerber, GerberSet } from './ParseGerber';
import type { GerberSocket } from './ParseSockets';
import { parseSockets } from './ParseSockets';

const initCanvas = (canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  offsetX = canvas.width / 2;
  offsetY = canvas.height / 2;
}

type Coord = { x: number; y: number };
type Tool = { shape: string; params: number[] };

// Basic transform: scale and center
const scale = 20; //mm to pixels
let offsetX: number;
let offsetY: number;

// Draw each Gerber layer
// NOTE: Mostly AI generated function, haven't looked at it properly yet
const drawGerberLayer = (gerber: Gerber, canvas: HTMLCanvasElement, layerNumber = 0) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas 2D context.');
    return;
  }

  const drawColor = 'hsl(' + (layerNumber * 67 % 360) + ', 70%, 50%)';

  const tools: Record<string, Tool> = {};
  let currentTool: Tool | null = null;
  let lastCoord: Coord | null = null;

  for (const item of gerber.graphicObjects) {
    if (item.type === 'tool') {
      tools[item.code] = item.tool;
    }

    if (item.type === 'set' && item.prop === 'tool') {
      currentTool = tools[item.value];
    }

    if (item.type === 'op') {
      const { x, y } = item.coord;
      const px = offsetX + x * scale;
      const py = offsetY - y * scale;

      if (item.op === 'move') {
        lastCoord = { x: px, y: py };
      }

      if (item.op === 'int' && lastCoord && currentTool) {
        ctx.beginPath();
        ctx.moveTo(lastCoord.x, lastCoord.y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = (currentTool.params?.[0] || 0.2) * scale;
        ctx.stroke();
        lastCoord = { x: px, y: py };
      }

      if (item.op === 'flash' && currentTool) {
        ctx.beginPath();
        const radius = (currentTool.params?.[0] || 0.2) * scale / 2;
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fillStyle = drawColor;
        ctx.fill();
      }
    }
  }
}

const drawGerberSocket = (socket: GerberSocket, canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas 2D context.');
    return;
  }

  const px = offsetX + socket.x * scale;
  const py = offsetY - socket.y * scale;

  const radius = 5;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'black';
  ctx.fill();

  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(socket.ascii, px + 10, py);
}

export const drawGerberCanvas = (gerberSet: GerberSet, canvas: HTMLCanvasElement) => {
  console.log('Drawing Gerber Layers:', gerberSet.gerbers);

  initCanvas(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas 2D context.');
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw gerber layers
  for (const gerber of gerberSet.gerbers) {
    drawGerberLayer(gerber, canvas, gerberSet.gerbers.indexOf(gerber));
  }

  // Overlay semi-transparent white to fade layers
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw sockets ontop
  const sockets: GerberSocket[] = parseSockets(gerberSet);
  for (const socket of sockets) {
    drawGerberSocket(socket, canvas);
  }
}
