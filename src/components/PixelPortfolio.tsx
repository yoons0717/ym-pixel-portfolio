import React, {useEffect, useRef} from "react";
import Phaser from "phaser";

interface RoomConfig {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface WallConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

class PortfolioScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly baseScale: number = 6;
  private cameraZoom!: number;

  private readonly MAP_STRUCTURE = {
    WALL_THICKNESS: 1,
    DOOR_START: 112,
    DOOR_END: 144,
    ROOMS: {
      LEFT: {
        left: 64,
        right: 176,
        top: 64,
        bottom: 160,
      },
      RIGHT: {
        left: 224,
        right: 336,
        top: 64,
        bottom: 176,
      },
      CORRIDOR: {
        left: 177,
        right: 224,
      },
    },
    PLAYER_START: {x: 90, y: 90},
  };

  constructor() {
    super({
      key: "PortfolioScene",
    });
  }

  preload() {
    console.log("에셋 로딩 시작...");

    this.load.image("room_map", "assets/room_map.png");
    this.load.spritesheet(
      "character_spritesheet",
      "assets/character_spritesheet.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      }
    );

    this.load.on("ready", () => {
      this.add.graphics().generateTexture("invisible", 1, 1);
    });

    this.load.on("complete", () => {
      console.log("모든 에셋 로드 완료");
    });

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("에셋 로드 실패:", file.key);
    });
  }

  create() {
    const {width: gameWidth, height: gameHeight} = this.scale;
    console.log("씬 생성 시작...", gameWidth, gameHeight);

    this.initializeCamera(gameWidth, gameHeight);
    this.setupMap();
    this.createPlayer();
    this.setupPhysics();
    this.createMapBounds();
    this.createPlayerAnimations();
    this.setupControls();
  }

  private initializeCamera(gameWidth: number, gameHeight: number) {
    this.cameraZoom = this.calculateCameraZoom(gameWidth, gameHeight);
    console.log("계산된 카메라 줌:", this.cameraZoom);
    this.scale.on("resize", this.handleResize, this);
  }

  private setupMap() {
    const roomMap = this.add.image(0, 0, "room_map");
    roomMap.setOrigin(0, 0);
    roomMap.setScale(this.baseScale);

    const {displayWidth, displayHeight} = roomMap;
    console.log("맵 표시 크기:", displayWidth, displayHeight);

    this.cameras.main.setBounds(0, 0, displayWidth, displayHeight);
    this.cameras.main.setZoom(this.cameraZoom);
    this.physics.world.setBounds(0, 0, displayWidth, displayHeight);
  }

  private createPlayer() {
    const {x, y} = this.MAP_STRUCTURE.PLAYER_START;
    this.player = this.physics.add.sprite(
      x * this.baseScale,
      y * this.baseScale,
      "character_spritesheet",
      960
    );
    this.player.setScale(this.baseScale);
    this.player.body!.setCollideWorldBounds(false);

    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
  }

  private setupPhysics() {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  private calculateCameraZoom(gameWidth: number, gameHeight: number): number {
    const baseWidth = 1920;
    const baseHeight = 1080;
    const baseZoom = 1;

    const scaleX = gameWidth / baseWidth;
    const scaleY = gameHeight / baseHeight;
    const dynamicZoom = Math.min(scaleX, scaleY) * baseZoom;

    const minZoom = 0.8;
    const maxZoom = 3.0;

    return Math.max(minZoom, Math.min(maxZoom, dynamicZoom));
  }

  private handleResize = (gameSize: Phaser.Structs.Size) => {
    const newZoom = this.calculateCameraZoom(gameSize.width, gameSize.height);

    if (Math.abs(this.cameraZoom - newZoom) > 0.01) {
      this.cameraZoom = newZoom;
      this.cameras.main.setZoom(this.cameraZoom);
      console.log("화면 크기 변경으로 인한 줌 업데이트:", this.cameraZoom);
    }
  };

  private createMapBounds() {
    console.log("맵 구조 벽 생성 시작");
    const walls = this.physics.add.staticGroup();

    this.createRoomWalls(walls, this.MAP_STRUCTURE.ROOMS.LEFT, {
      hasRightDoor: true,
    });
    this.createRoomWalls(walls, this.MAP_STRUCTURE.ROOMS.RIGHT, {
      hasLeftDoor: true,
    });
    this.createCorridorWalls(walls);

    this.physics.add.collider(this.player, walls);
    console.log("맵 구조 벽 생성 완료");
  }

  private createRoomWalls(
    walls: Phaser.Physics.Arcade.StaticGroup,
    roomConfig: RoomConfig,
    options: {hasLeftDoor?: boolean; hasRightDoor?: boolean} = {}
  ) {
    const room = this.scaleRoom(roomConfig);
    const {width, height, centerX, centerY} = this.getRoomDimensions(room);

    // 기본 벽들 (상, 하)
    const basicWalls: WallConfig[] = [
      {
        x: centerX,
        y: room.top - this.MAP_STRUCTURE.WALL_THICKNESS / 2,
        width,
        height: this.MAP_STRUCTURE.WALL_THICKNESS,
      },
      {
        x: centerX,
        y: room.bottom + this.MAP_STRUCTURE.WALL_THICKNESS / 2,
        width,
        height: this.MAP_STRUCTURE.WALL_THICKNESS,
      },
    ];

    // 왼쪽 벽 (문이 없는 경우에만)
    if (!options.hasLeftDoor) {
      basicWalls.push({
        x: room.left - this.MAP_STRUCTURE.WALL_THICKNESS / 2,
        y: centerY,
        width: this.MAP_STRUCTURE.WALL_THICKNESS,
        height,
      });
    }

    // 오른쪽 벽 (문이 없는 경우에만)
    if (!options.hasRightDoor) {
      basicWalls.push({
        x: room.right + this.MAP_STRUCTURE.WALL_THICKNESS / 2,
        y: centerY,
        width: this.MAP_STRUCTURE.WALL_THICKNESS,
        height,
      });
    }

    // 왼쪽 벽에 문이 있는 경우
    if (options.hasLeftDoor) {
      const doorWalls = this.createDoorWalls(room, "left");
      basicWalls.push(...doorWalls);
    }

    // 오른쪽 벽에 문이 있는 경우
    if (options.hasRightDoor) {
      const doorWalls = this.createDoorWalls(room, "right");
      basicWalls.push(...doorWalls);
    }

    basicWalls.forEach((config) => this.createWall(config, walls));
  }

  private createDoorWalls(
    room: RoomConfig,
    side: "left" | "right"
  ): WallConfig[] {
    const doorStart = this.MAP_STRUCTURE.DOOR_START * this.baseScale;
    const doorEnd = this.MAP_STRUCTURE.DOOR_END * this.baseScale;
    const wallX =
      side === "right"
        ? room.right + this.MAP_STRUCTURE.WALL_THICKNESS / 2
        : room.left - this.MAP_STRUCTURE.WALL_THICKNESS / 2;

    return [
      {
        x: wallX,
        y: room.top + (doorStart - room.top) / 2,
        width: this.MAP_STRUCTURE.WALL_THICKNESS,
        height: doorStart - room.top,
      },
      {
        x: wallX,
        y: doorEnd + (room.bottom - doorEnd) / 2,
        width: this.MAP_STRUCTURE.WALL_THICKNESS,
        height: room.bottom - doorEnd - this.MAP_STRUCTURE.WALL_THICKNESS,
      },
    ];
  }

  private createCorridorWalls(walls: Phaser.Physics.Arcade.StaticGroup) {
    const corridor = {
      left: this.MAP_STRUCTURE.ROOMS.CORRIDOR.left * this.baseScale,
      right: this.MAP_STRUCTURE.ROOMS.CORRIDOR.right * this.baseScale,
      top: this.MAP_STRUCTURE.DOOR_START * this.baseScale,
      bottom: this.MAP_STRUCTURE.DOOR_END * this.baseScale,
    };

    const corridorWidth = corridor.right - corridor.left;
    const corridorCenterX = corridor.left + corridorWidth / 2;

    const wallConfigs: WallConfig[] = [
      {
        x: corridorCenterX,
        y: corridor.top - this.MAP_STRUCTURE.WALL_THICKNESS / 2,
        width: corridorWidth,
        height: this.MAP_STRUCTURE.WALL_THICKNESS,
      },
      {
        x: corridorCenterX,
        y: corridor.bottom + this.MAP_STRUCTURE.WALL_THICKNESS / 2,
        width: corridorWidth,
        height: this.MAP_STRUCTURE.WALL_THICKNESS,
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
    return {width, height, centerX, centerY};
  }

  private createWall(
    config: WallConfig,
    walls: Phaser.Physics.Arcade.StaticGroup
  ) {
    const wall = this.physics.add.staticSprite(config.x, config.y, "invisible");
    wall.setSize(config.width, config.height);
    wall.setVisible(false);
    walls.add(wall);
    return wall;
  }

  private createPlayerAnimations() {
    const animations = [
      {
        key: "idle",
        frames: [{key: "character_spritesheet", frame: 960}],
        frameRate: 1,
      },
      {key: "walk_down", start: 960, end: 963, frameRate: 8, repeat: -1},
      {key: "walk_right", start: 999, end: 1002, frameRate: 8, repeat: -1},
      {key: "walk_up", start: 1038, end: 1041, frameRate: 8, repeat: -1},
      {key: "walk_left", start: 1077, end: 1080, frameRate: 8, repeat: -1},
    ];

    animations.forEach((anim) => {
      if (anim.key === "idle") {
        this.anims.create({
          key: anim.key,
          frames: anim.frames,
          frameRate: anim.frameRate,
        });
      } else {
        this.anims.create({
          key: anim.key,
          frames: this.anims.generateFrameNumbers("character_spritesheet", {
            start: anim.start!,
            end: anim.end!,
          }),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      }
    });

    console.log("플레이어 애니메이션 생성 완료");
  }

  update() {
    if (!this.player) return;

    const speed = 400;
    const movements = {
      left: {x: -speed, y: 0, anim: "walk_left"},
      right: {x: speed, y: 0, anim: "walk_right"},
      up: {x: 0, y: -speed, anim: "walk_up"},
      down: {x: 0, y: speed, anim: "walk_down"},
    };

    let isMoving = false;

    for (const [direction, movement] of Object.entries(movements)) {
      if (this.cursors[direction as keyof typeof this.cursors].isDown) {
        this.player.setVelocity(movement.x, movement.y);
        this.player.play(movement.anim, true);
        isMoving = true;
        break;
      }
    }

    if (!isMoving) {
      this.player.setVelocity(0, 0);
      this.player.play("idle", true);
    }
  }
}

// React 컴포넌트
const PhaserPortfolio: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      console.log("Phaser 게임 초기화...");

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        backgroundColor: "#3e245a",
        scene: PortfolioScene,
        physics: {
          default: "arcade",
          arcade: {
            debug: true,
          },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          antialias: false,
          pixelArt: true,
        },
      };

      phaserGameRef.current = new Phaser.Game(config);
      console.log("Phaser 게임 초기화 완료");
    }

    return () => {
      if (phaserGameRef.current) {
        console.log("Phaser 게임 정리...");
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div ref={gameRef} />
    </div>
  );
};

export default PhaserPortfolio;
