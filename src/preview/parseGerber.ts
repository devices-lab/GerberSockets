import type { Dispatch, SetStateAction } from "react";
import JSZip from "jszip";
import { drawGerber, drawStackup } from "./drawGerber";
import { parseSockets } from "./parseSockets";
import type { GerberSocket } from "./parseSockets";
import { clearCanvas } from "./drawGerber";

let gerberParserReady: Promise<any> | null = null;
let pcbStackupReady: Promise<any> | null = null;

// Dynamically load the gerber-parser script from CDN
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

// Dynamically load the pcb-stackup script from CDN
const loadPcbStackupLibrary = (): Promise<any> => {
  if (pcbStackupReady) return pcbStackupReady;

  pcbStackupReady = new Promise((resolve, reject) => {
    if ((window as any).pcbStackup) {
      resolve((window as any).pcbStackup);
      return;
    }

    const script = document.createElement("script");
    // script.src = "https://unpkg.com/pcb-stackup@^4.0.0/dist/pcb-stackup.min.js";
    script.src = "pcb-stackup.min.js"; // Local copy
    script.async = true;

    script.onload = () => {
      if ((window as any).pcbStackup) {
        resolve((window as any).pcbStackup);
      } else {
        reject(new Error("pcbStackup not found on window"));
      }
    };

    script.onerror = () =>
      reject(new Error("Failed to load pcb-stackup script"));

    document.body.appendChild(script);
  });

  return pcbStackupReady;
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
  filename: string;
}

export interface GerberSet {
  gerbers: Gerber[];
  zipFilename: string | null;
  stackup: any | null;
}

// Parse a single Gerber file's content
const parseGerberContent = async (content: string, name: string) => {
  const gerberParser = await loadGerberParserLibrary();
  const parser = gerberParser();

  const parsedData: any[] = [];

  parser.on("data", (data: any) => {
    parsedData.push(data);
  });

  parser.write(content);
  parser.end();

  return { name, parsedData };
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
  ".gm1", // Mechanical Layer 1
  ".gm2", // Mechanical Layer 2
  ".gml", // Gerber Mechanical Layer
  ".gko", // Keep-out layer
  ".gbs", // Gerber Bottom Soldermask
  ".gts", // Gerber Top Soldermask

  ".drl", // Drill file (Excellon format)
  ".xln", // Alternate drill file extension

  // ".gpi", // Gerber Plot Information
];

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
  showStackup: boolean,
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
    stackup: null,
  };

  // Clear previous status
  setStatusMessage(null);
  setStatusSeverity("info");
  onSocketsParsed([]);
  clearCanvas(canvas);

  const stackupLayers = [];

  // Zip upload
  if (isValidZipFile(file.name)) {
    gerberSet.zipFilename = file.name;

    const files = await zipToFileTexts(file);

    for (const gbrFile of files) {
      if (isValidGerberFile(gbrFile.name)) {
        // Add to stackup layers
        stackupLayers.push({
          filename: gbrFile.name,
          gerber: gbrFile.content,
        });

        // The text of a file in the zip
        const result = await parseGerberContent(gbrFile.content, gbrFile.name);
        parsedGerbers.push({
          filename: result.name,
          graphicObjects: result.parsedData,
        } as Gerber);
      }
    }
  } else if (isValidGerberFile(file.name)) {
    // Single Gerber file upload

    if (isValidGerberFile(file.name)) {
      const content = await file.text();

      // Add to stackup layers
      stackupLayers.push({
        filename: file.name,
        gerber: content
      });

      const result = await parseGerberContent(content, file.name);
      parsedGerbers.push({
        filename: result.name,
        graphicObjects: result.parsedData,
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

  // Generate PCB stackup (render) from the Gerber layers
  const pcbStackup = await loadPcbStackupLibrary();
  const stackupOptions = {
    // useOutline: false,
    outlineGapFill: 0.011,
    color: {
      sm: 'rgba(4, 99, 7, 0.75)',

      // Default colors:
      // fr4: '#666',
      // cu: '#ccc',
      // cf: '#c93',
      // sm: 'rgba(0, 66, 0, 0.75)',
      // ss: '#fff',
      // sp: '#999',
      // out: '#000',
    }
  };
  // NOTE: API reference: https://github.com/tracespace/tracespace/blob/v4.2.8/packages/pcb-stackup/API.md
  gerberSet.stackup = await pcbStackup(stackupLayers, stackupOptions); // TODO: Does the order of the layers passed matter?

  const sockets: GerberSocket[] = parseSockets(
    gerberSet,
    setStatusMessage,
    setStatusSeverity
  );

  // Draw the gerber onto the canvas, and store socket canvas positions in sockets
  drawGerber(gerberSet, sockets, canvas);
  if (showStackup) drawStackup(gerberSet.stackup, canvas);

  // Return socket info for the UI (including canvas positions)
  console.log("Parsed GerberSockets:", sockets);
  onSocketsParsed(sockets);

  console.log("Completed Gerber upload handling.", gerberSet);
};
