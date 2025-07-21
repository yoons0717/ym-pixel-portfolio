import type { RoomConfig, WallConfig } from '../types/game';
import { MAP_STRUCTURE } from './mapStructure';

export class WallSystem {
  private scene: Phaser.Scene;
  private baseScale: number;
  private mapContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, baseScale: number) {
    this.scene = scene;
    this.baseScale = baseScale;
  }

  public setMapContainer(mapContainer: Phaser.GameObjects.Container) {
    this.mapContainer = mapContainer;
  }

  public createMapBounds(player: Phaser.Physics.Arcade.Sprite) {
    console.log('맵 구조 벽 생성 시작');
    const walls = this.scene.physics.add.staticGroup();
    const furniture = this.scene.physics.add.staticGroup();

    this.createRoomWalls(walls, MAP_STRUCTURE.ROOMS.LEFT, { hasRightDoor: true });
    this.createRoomWalls(walls, MAP_STRUCTURE.ROOMS.RIGHT, { hasLeftDoor: true });
    this.createCorridorWalls(walls);
    this.createFurniture(furniture);

    this.scene.physics.add.collider(player, walls);

    console.log('맵 구조 벽 생성 완료');
    return { walls, furniture };
  }

  private createFurniture(furniture: Phaser.Physics.Arcade.StaticGroup) {
    console.log('가구 생성 시작...');
    const furnitureItems: Phaser.Physics.Arcade.Sprite[] = [];

    Object.entries(MAP_STRUCTURE.FURNITURE).forEach(([key, config]) => {
      const mapX = this.mapContainer?.x || 0;
      const mapY = this.mapContainer?.y || 0;

      const furnitureItem = this.scene.physics.add.staticSprite(
        mapX + config.x * this.baseScale,
        mapY + config.y * this.baseScale,
        'invisible'
      );

      furnitureItem.setSize(config.width * this.baseScale, config.height * this.baseScale);
      furnitureItem.setVisible(true);
      furnitureItem.setData('message', config.message);
      furnitureItem.setData('name', key);
      furniture.add(furnitureItem);
      furnitureItems.push(furnitureItem);

      console.log(
        `가구 ${key} 생성됨 - 맵기준(${config.x}, ${config.y}) -> 절대좌표(${furnitureItem.x}, ${furnitureItem.y})`
      );
    });

    console.log('가구 생성 완료');
    return furnitureItems;
  }

  private createRoomWalls(
    walls: Phaser.Physics.Arcade.StaticGroup,
    roomConfig: RoomConfig,
    options: { hasLeftDoor?: boolean; hasRightDoor?: boolean } = {}
  ) {
    const room = this.scaleRoom(roomConfig);
    const { width, height, centerX, centerY } = this.getRoomDimensions(room);

    const mapX = this.mapContainer?.x || 0;
    const mapY = this.mapContainer?.y || 0;

    const basicWalls: WallConfig[] = [
      {
        x: mapX + centerX,
        y: mapY + room.top - MAP_STRUCTURE.WALL_THICKNESS / 2,
        width,
        height: MAP_STRUCTURE.WALL_THICKNESS,
      },
      {
        x: mapX + centerX,
        y: mapY + room.bottom + MAP_STRUCTURE.WALL_THICKNESS / 2,
        width,
        height: MAP_STRUCTURE.WALL_THICKNESS,
      },
    ];

    if (!options.hasLeftDoor) {
      basicWalls.push({
        x: mapX + room.left - MAP_STRUCTURE.WALL_THICKNESS / 2,
        y: mapY + centerY,
        width: MAP_STRUCTURE.WALL_THICKNESS,
        height,
      });
    }

    if (!options.hasRightDoor) {
      basicWalls.push({
        x: mapX + room.right + MAP_STRUCTURE.WALL_THICKNESS / 2,
        y: mapY + centerY,
        width: MAP_STRUCTURE.WALL_THICKNESS,
        height,
      });
    }

    if (options.hasLeftDoor) {
      const doorWalls = this.createDoorWalls(room, 'left', mapX, mapY);
      basicWalls.push(...doorWalls);
    }

    if (options.hasRightDoor) {
      const doorWalls = this.createDoorWalls(room, 'right', mapX, mapY);
      basicWalls.push(...doorWalls);
    }

    basicWalls.forEach((config) => this.createWall(config, walls));
  }

  private createDoorWalls(
    room: RoomConfig,
    side: 'left' | 'right',
    mapX: number,
    mapY: number
  ): WallConfig[] {
    const doorStart = MAP_STRUCTURE.DOOR_START * this.baseScale;
    const doorEnd = MAP_STRUCTURE.DOOR_END * this.baseScale;
    const wallX =
      side === 'right'
        ? mapX + room.right + MAP_STRUCTURE.WALL_THICKNESS / 2
        : mapX + room.left - MAP_STRUCTURE.WALL_THICKNESS / 2;

    return [
      {
        x: wallX,
        y: mapY + room.top + (doorStart - room.top) / 2,
        width: MAP_STRUCTURE.WALL_THICKNESS,
        height: doorStart - room.top,
      },
      {
        x: wallX,
        y: mapY + doorEnd + (room.bottom - doorEnd) / 2,
        width: MAP_STRUCTURE.WALL_THICKNESS,
        height: room.bottom - doorEnd - MAP_STRUCTURE.WALL_THICKNESS,
      },
    ];
  }

  private createCorridorWalls(walls: Phaser.Physics.Arcade.StaticGroup) {
    const mapX = this.mapContainer?.x || 0;
    const mapY = this.mapContainer?.y || 0;

    const corridor = {
      left: MAP_STRUCTURE.ROOMS.CORRIDOR.left * this.baseScale,
      right: MAP_STRUCTURE.ROOMS.CORRIDOR.right * this.baseScale,
      top: MAP_STRUCTURE.DOOR_START * this.baseScale,
      bottom: MAP_STRUCTURE.DOOR_END * this.baseScale,
    };

    const corridorWidth = corridor.right - corridor.left;
    const corridorCenterX = corridor.left + corridorWidth / 2;

    const wallConfigs: WallConfig[] = [
      {
        x: mapX + corridorCenterX,
        y: mapY + corridor.top - MAP_STRUCTURE.WALL_THICKNESS / 2,
        width: corridorWidth,
        height: MAP_STRUCTURE.WALL_THICKNESS,
      },
      {
        x: mapX + corridorCenterX,
        y: mapY + corridor.bottom + MAP_STRUCTURE.WALL_THICKNESS / 2,
        width: corridorWidth,
        height: MAP_STRUCTURE.WALL_THICKNESS,
      },
    ];

    wallConfigs.forEach((config) => this.createWall(config, walls));
  }

  private scaleRoom(roomConfig: RoomConfig): RoomConfig {
    return {
      left: roomConfig.left * this.baseScale,
      right: roomConfig.right * this.baseScale,
      top: roomConfig.top * this.baseScale,
      bottom: roomConfig.bottom * this.baseScale,
    };
  }

  private getRoomDimensions(room: RoomConfig) {
    const width = room.right - room.left;
    const height = room.bottom - room.top;
    const centerX = room.left + width / 2;
    const centerY = room.top + height / 2;
    return { width, height, centerX, centerY };
  }

  private createWall(config: WallConfig, walls: Phaser.Physics.Arcade.StaticGroup) {
    const wall = this.scene.physics.add.staticSprite(config.x, config.y, 'invisible');
    wall.setSize(config.width, config.height);
    wall.setVisible(false);
    walls.add(wall);
    return wall;
  }
}
