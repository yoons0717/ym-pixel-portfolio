import Link from '../components/Link';
import type { FurnitureConfig, RoomConfig } from '../types/game';

export const MAP_STRUCTURE = {
  WALL_THICKNESS: 1,
  DOOR_START: 112,
  DOOR_END: 144,
  ROOMS: {
    LEFT: { left: 64, right: 176, top: 75, bottom: 160 } as RoomConfig,
    RIGHT: { left: 224, right: 336, top: 75, bottom: 176 } as RoomConfig,
    CORRIDOR: { left: 177, right: 224 },
  },
  PLAYER_START: {
    x: 200,
    y: 120,
  },
  FURNITURE: {
    SOFA: {
      x: 112,
      y: 114,
      width: 28,
      height: 15,
      message: (
        <>
          This is where you chill out, watch YouTube, and snack on your favorites. The ultimate spot
          to relax and do absolutely nothing.
        </>
      ),
    } as FurnitureConfig,
    COMPUTER: {
      x: 168,
      y: 80,
      width: 14,
      height: 20,
      message: (
        <>This is my PC. Where I spend most of my day turning coffee into code (and bugs).</>
      ),
    } as FurnitureConfig,
    DESK: {
      x: 240,
      y: 85,
      width: 30,
      height: 14,
      message: (
        <>
          Feel free to stalk my <Link href="https://github.com/yoons0717">GitHub</Link> or shoot me
          an email at yoons0717@gmail.com - I actually reply!
        </>
      ),
    } as FurnitureConfig,
    BED: {
      x: 328,
      y: 88,
      width: 12,
      height: 14,
      message: (
        <>
          This is where every day begins and ends — my bed. Late-night Reels, early-morning scrolls,
          and everything in between. It’s the coziest corner of my world.
        </>
      ),
    } as FurnitureConfig,
  },
} as const;
