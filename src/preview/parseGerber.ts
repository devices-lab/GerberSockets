import type { Dispatch, SetStateAction } from "react";
import JSZip from "jszip";
import { drawGerberCanvas } from "./drawGerber";
import { parseSockets } from "./parseSockets";
import type { GerberSocket } from "./parseSockets";
import { clearCanvas } from "./drawGerber";

let gerberParserReady: Promise<any> | null = null;

// Dynamically load the gerber-parser script from CDN
//https://www.npmjs.com/package/gerber-parser (not the 5.0.0 tracespace one)
const loadGerberParserLibrary = (): Promise<any> => {
  if (gerberParserReady) return gerberParserReady;

  gerberParserReady = new Promise((resolve, reject) => {
    if ((window as any).gerberParser) {
      resolve((window as any).gerberParser);
      return;
    }

    const script = document.createElement("script");
    // script.src = 'https://unpkg.com/gerber-parser@^4.0.0/dist/gerber-parser.min.js';
    script.src = "gerber-parser.min.js"; // Local copy
    script.async = true;

    script.onload = () => {
      if ((window as any).gerberParser) {
        resolve((window as any).gerberParser);
      } else {
        reject(new Error("gerberParser not found on window"));
      }
    };

    script.onerror = () =>
      reject(new Error("Failed to load gerber-parser script"));

    document.body.appendChild(script);
  });

  return gerberParserReady;
};

let gerberPlotterReady: Promise<any> | null = null;

// Dynamically load the gerber-plotter script from CDN
//https://www.npmjs.com/package/gerber-plotter (not the 5.0.0 tracespace one)
const loadGerberPlotterLibrary = (): Promise<any> => {
  if (gerberPlotterReady) return gerberPlotterReady;

  gerberPlotterReady = new Promise((resolve, reject) => {
    if ((window as any).gerberPlotter) {
      resolve((window as any).gerberPlotter);
      return;
    }

    const script = document.createElement("script");
    script.src = 'https://unpkg.com/gerber-plotter@^4.0.0/dist/gerber-plotter.min.js';
    // script.src = "gerber-plotter.min.js"; // Local copy
    script.async = true;

    script.onload = () => {
      if ((window as any).gerberPlotter) {
        resolve((window as any).gerberPlotter);
      } else {
        reject(new Error("gerberPlotter not found on window"));
      }
    };

    script.onerror = () =>
      reject(new Error("Failed to load gerber-plotter script"));

    document.body.appendChild(script);
  });

  return gerberPlotterReady;
};


// Return (filename -> text content) mapping for all files (of any type) in the zip
const zipToFileTexts = async (file: File) => {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const textFiles = await Promise.all(
    Object.values(zipContent.files)
      .filter((file) => !file.dir)
      .map(async (file) => {
        const content = await file.async("text");
        return {
          name: file.name,
          content,
        };
      })
  );

  return textFiles;
};

export interface Gerber {
  graphicObjects: any[];
  plotterObjects: any[]; // Currently unused
  filename: string;
}

export interface GerberSet {
  gerbers: Gerber[];
  zipFilename: string | null;
}

// Parse a single Gerber file's content
const parseGerberContent = async (content: string, name: string) => {
  // Parser turns Gerber file's text into a JSON abstract syntax tree (AST)
  const gerberParser = await loadGerberParserLibrary();
  // Plotter turns the Gerber AST into graphic objects (e.g. shapes, pads) for rendering (some proprietary format?)
  const gerberPlotter = await loadGerberPlotterLibrary();

  const parser = gerberParser();
  const plotter = gerberPlotter();

  const parsedData: any[] = [];
  const plottedData: any[] = [];

  parser.on("data", (data: any) => {
    parsedData.push(data);
  });
  plotter.on("data", (data: any) => {
    plottedData.push(data);
  });

  parser.pipe(plotter);
  parser.write(content);
  parser.end();

  return { name, parsedData, plottedData };
};

// Any files that have gerber graphics objects inside
export const validGerberExtensions = [
  ".zip", // Compressed archive of multiple Gerber files
  ".gbr", // Generic Gerber file
  ".gbl", // Gerber Bottom Layer
  ".gtl", // Gerber Top Layer
  ".gbs", // Gerber Bottom Soldermask
  ".gts", // Gerber Top Soldermask
  ".gbo", // Gerber Bottom Silkscreen (Overlay)
  ".gto", // Gerber Top Silkscreen (Overlay)
  ".gbp", // Gerber Bottom Paste
  ".gtp", // Gerber Top Paste
  ".gko", // Keep-out layer
  ".gbs", // Gerber Bottom Soldermask
  ".gts", // Gerber Top Soldermask

  ".drl", // Drill file (Excellon format)
  ".xln", // Alternate drill file extension
  // ".gpi", // Gerber Plot Information

  ".gm",
  ".gml", // Gerber Mechanical Layer
];

for (let i = 1; i < 100; i++) validGerberExtensions.push(`.gm${i}`);

const isValidGerberFile = (fileName: string) => {
  return validGerberExtensions.some((ext) =>
    fileName.toLowerCase().endsWith(ext)
  );
};
const isValidZipFile = (fileName: string) => {
  return fileName.toLowerCase().endsWith(".zip");
};

// Turn uploaded file(s) (zip/gbr) into parsed gerber data
// TODO: Break up into smaller functions
export const handleGerberUpload = async (
  file: File,
  canvas: HTMLCanvasElement,
  setStatusMessage: Dispatch<SetStateAction<string | null>>,
  setStatusSeverity: Dispatch<
    SetStateAction<"error" | "warning" | "info" | "success">
  >,
  onSocketsParsed: (sockets: GerberSocket[]) => void
) => {
  const parsedGerbers: Gerber[] = [];

  const gerberSet: GerberSet = {
    zipFilename: null,
    gerbers: [],
  };

  // Clear previous status
  setStatusMessage(null);
  setStatusSeverity("info");
  onSocketsParsed([]);
  clearCanvas(canvas);

  // Zip upload
  if (isValidZipFile(file.name)) {
    gerberSet.zipFilename = file.name;

    const files = await zipToFileTexts(file);
    for (const gbrFile of files) {
      if (isValidGerberFile(gbrFile.name)) {
        // The text of a file in the zip
        const result = await parseGerberContent(gbrFile.content, gbrFile.name);
        parsedGerbers.push({
          filename: result.name,
          graphicObjects: result.parsedData,
          plotterObjects: result.plottedData,
        } as Gerber);
      }
    }
  } else if (isValidGerberFile(file.name)) {
    // Single Gerber file upload

    if (isValidGerberFile(file.name)) {
      const content = await file.text();
      const result = await parseGerberContent(content, file.name);

      parsedGerbers.push({
        filename: result.name,
        graphicObjects: result.parsedData,
        plotterObjects: result.plottedData,
      } as Gerber);
    }
  } else {
    setStatusMessage(
      "The uploaded file was not recognized as a Gerber file / zip"
    );
    setStatusSeverity("error");
    return;
  }

  gerberSet.gerbers = parsedGerbers;

  if (gerberSet.gerbers.length === 0) {
    if (file.name.endsWith(".zip")) {
      setStatusMessage("No Gerber files were found in the uploaded zip");
      setStatusSeverity("error");
    } else {
      setStatusMessage(
        "The uploaded file was not recognized as a Gerber file"
      );
      setStatusSeverity("error");
    }
    return;
  }

  const sockets: GerberSocket[] = parseSockets(
    gerberSet,
    setStatusMessage,
    setStatusSeverity
  );

  // Draw the gerber onto the canvas, and store socket canvas positions in sockets
  drawGerberCanvas(gerberSet, sockets, canvas);

  // Return socket info for the UI (including canvas positions)
  console.log("Parsed GerberSockets:", sockets);
  onSocketsParsed(sockets);
};
