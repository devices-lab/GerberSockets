import { convertToCircles } from "./calculateCircles";
import { generateKiCadSymbols } from "./kicad/generateSymbols";
import { generateKiCadFootprint } from "./kicad/generateFootprint";

export type CrosshairLayer = "F.Fab" | "User.Drawing";
export type SocketsLayer = "User.1" | "GerberSockets";
export type EDA = "KiCad" | "Altium";

export type UserInput = {
  eda: EDA;
  netNames: string[];
  crosshairLayer: CrosshairLayer;
  socketsLayer: SocketsLayer;
  copperPadDiameter: number;
};

export type GeneratedFiles = {
  // relative file path -> content
  [path: string]: string;
};

export function generateLibrary(userInput: UserInput): GeneratedFiles {
  if (userInput.eda === "KiCad") {
    return generateKiCadLibrary(userInput);
  } if (userInput.eda === "Altium") {
    return generateAltiumLibrary();
  }
  throw new Error("Unsupported EDA tool.");
}

function generateKiCadLibrary(userInput: UserInput): GeneratedFiles {
  const files: GeneratedFiles = {};
  const modDir = "GerberSockets/GerberSockets.pretty";

  /* KiCad library folder structure
  /GerberSockets/
    /GerberSockets.pretty/
      - foo.kicad_mod
      - bar.kicad_mod
    - GerberSockets.kicad_sym
  */

  // Footprints
  for (const netName of userInput.netNames) {
    if (netName.length < 1 || netName.length > 99) {
      throw new Error("Net name length must be between 1 and 99 characters.");
    }
    if (!/^[\x00-\x7F]*$/.test(netName)) {
      throw new Error("Net name must contain only ASCII characters.");
    }
    const circles = convertToCircles(netName);
    const footprint = generateKiCadFootprint(
      netName,
      circles,
      userInput.crosshairLayer,
      userInput.socketsLayer,
      userInput.copperPadDiameter
    );
    const fileName = `${netName}.kicad_mod`;
    files[`${modDir}/${fileName}`] = footprint;
  }

  // Symbols
  const symbols = generateKiCadSymbols(userInput.netNames);
  files["GerberSockets/GerberSockets.kicad_sym"] = symbols;

  return files;
}

function generateAltiumLibrary(): GeneratedFiles {
  // Not implemented yet
  throw new Error("Altium library generation is not implemented.");
}
