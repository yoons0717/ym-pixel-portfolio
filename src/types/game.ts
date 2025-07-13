export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: GameObjectType;
  dialog: string;
}

export type GameObjectType =
  | "sofa"
  | "computer"
  | "bookshelf"
  | "plant"
  | "resume";

export interface KeyState {
  [key: string]: boolean;
}

export interface PixelComponentProps {
  x: number;
  y: number;
}
