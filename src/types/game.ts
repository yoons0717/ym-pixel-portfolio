export interface RoomConfig {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface WallConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MessageContent = string | React.ReactElement;

export interface FurnitureConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  message: MessageContent;
}
