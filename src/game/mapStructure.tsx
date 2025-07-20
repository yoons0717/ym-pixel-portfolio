import Link from '../components/Link';
import type { RoomConfig } from '../types/game';
import type { FurnitureConfig } from './GameConfig';

export const MAP_STRUCTURE = {
  WALL_THICKNESS: 1,
  DOOR_START: 112,
  DOOR_END: 144,
  ROOMS: {
    LEFT: { left: 64, right: 176, top: 64, bottom: 160 } as RoomConfig,
    RIGHT: { left: 224, right: 336, top: 64, bottom: 176 } as RoomConfig,
    CORRIDOR: { left: 177, right: 224 },
  },
  PLAYER_START: {
    x: 200,
    y: 120,
  },
  FURNITURE: {
    SOFA: {
      x: 112,
      y: 112,
      width: 28,
      height: 24,
      message:
        'This is my comfortable sofa where I relax after coding.\nI often get my best ideas here!',
    } as FurnitureConfig,
    COMPUTER: {
      x: 168,
      y: 80,
      width: 14,
      height: 20,
      message: (
        <>
          This is my PC. I work mostly in JavaScript/TypeScript these days. I've made a couple of
          games in that language. Check out my{' '}
          <Link href="https://github.com/username">GitHub</Link>!
        </>
      ),
    } as FurnitureConfig,
    DESK: {
      x: 240,
      y: 85,
      width: 30,
      height: 14,
      message: (
        <>
          This is my workspace where I code and create. Most of my projects are built here! Check
          out my <Link href="https://github.com/username">GitHub</Link> and my{' '}
          <Link href="https://portfolio-site.com">Portfolio</Link>!
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
          My coding chair. Many hours spent here debugging!
          <br />
          Sometimes I fall asleep while coding late at night.
        </>
      ),
    } as FurnitureConfig,
  },
} as const;
