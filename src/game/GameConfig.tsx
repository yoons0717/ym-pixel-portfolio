import React from 'react';

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

// 스타일 컴포넌트들
export const Link: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: '#0066cc',
      textDecoration: 'underline',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = '#0052cc')}
    onMouseLeave={(e) => (e.currentTarget.style.color = '#0066cc')}
  >
    {children}
  </a>
);

export const Br = () => <br />;

export type MessageContent = string | React.ReactElement;

export interface FurnitureConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  message: MessageContent;
}

export const MAP_STRUCTURE = {
  WALL_THICKNESS: 1,
  DOOR_START: 112,
  DOOR_END: 144,
  ROOMS: {
    LEFT: { left: 64, right: 176, top: 64, bottom: 160 },
    RIGHT: { left: 224, right: 336, top: 64, bottom: 176 },
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
    },
    COMPUTER: {
      x: 168,
      y: 80,
      width: 14,
      height: 20,
      message: (
        <>
          This is my PC. I work mostly in JavaScript/TypeScript these days.
          <Br />
          I've made a couple of games in that language.
          <Br />
          Check out my <Link href="https://github.com/username">GitHub</Link>!
        </>
      ),
    },
    DESK: {
      x: 240,
      y: 85,
      width: 30,
      height: 14,
      message: (
        <>
          This is my workspace where I code and create.
          <Br />
          Most of my projects are built here!
          <Br />
          Check out my <Link href="https://github.com/username">GitHub</Link> and my{' '}
          <Link href="https://portfolio-site.com">Portfolio</Link>!
        </>
      ),
    },
    BED: {
      x: 328,
      y: 88,
      width: 12,
      height: 14,
      message: (
        <>
          My coding chair. Many hours spent here debugging!
          <Br />
          Sometimes I fall asleep while coding late at night.
        </>
      ),
    },
  },
} as const;
