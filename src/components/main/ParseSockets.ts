import type { Gerber, GerberSet } from './ParseGerber';

export interface GerberSocket {
  ascii: string;
  coords: number[][];
}

export interface GerberKeepoutZone {
  // TODO:
}

export const parseSockets = (gerberSet: GerberSet): GerberSocket[] => {
  // TODO: 
  return [];
}
