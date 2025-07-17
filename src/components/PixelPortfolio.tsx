import React, {useEffect, useRef} from "react";
import Phaser from "phaser";

class PortfolioScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private baseScale: number = 6; // 기본 스케일 고정값
  private cameraZoom!: number; // 카메라 줌 저장용

  // 공통 문 좌표 상수
  private readonly DOOR_START = 112;
  private readonly DOOR_END = 144;

  constructor() {
    super({key: "PortfolioScene"});
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

    // 빈 텍스처 생성 (벽 충돌체용)
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
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    console.log("씬 생성 시작...", gameWidth, gameHeight);

    // 카메라 줌 계산 (화면 크기에 따라 조정)
    this.cameraZoom = this.calculateCameraZoom(gameWidth, gameHeight);
    console.log("계산된 카메라 줌:", this.cameraZoom);

    // 물리 엔진 활성화
    this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

    const roomMap = this.add.image(
      0, // 맵을 월드 좌표 (0,0)에 배치
      0,
      "room_map"
    );
    roomMap.setOrigin(0, 0); // 원점을 왼쪽 상단으로 설정

    // 고정 스케일 적용
    roomMap.setScale(this.baseScale);

    const mapDisplayWidth = roomMap.displayWidth;
    const mapDisplayHeight = roomMap.displayHeight;

    console.log("맵 표시 크기:", mapDisplayWidth, mapDisplayHeight);

    this.player = this.physics.add.sprite(
      90 * this.baseScale, // 왼쪽 방 문 바로 옆
      90 * this.baseScale,
      "character_spritesheet",
      960
    );

    // 캐릭터에도 고정 스케일 적용
    this.player.setScale(this.baseScale);

    // 플레이어 이동 범위를 맵 경계로 제한
    this.player.body!.setCollideWorldBounds(false);

    // 물리 월드를 맵 크기에 맞게 확장
    this.physics.world.setBounds(0, 0, mapDisplayWidth, mapDisplayHeight);

    // 카메라 경계를 맵 크기에 맞게 설정
    this.cameras.main.setBounds(0, 0, mapDisplayWidth, mapDisplayHeight);
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05); // 더 부드러운 팔로우

    // 카메라 줌 적용
    this.cameras.main.setZoom(this.cameraZoom);

    // 맵 벽 생성
    this.createComplexMapBounds();

    // 애니메이션 생성
    this.createPlayerAnimations();

    // 키보드 입력 설정
    this.cursors = this.input.keyboard!.createCursorKeys();

    // 화면 크기 변경 이벤트 리스너
    this.scale.on("resize", this.handleResize, this);
  }

  private calculateCameraZoom(gameWidth: number, gameHeight: number): number {
    // 기준 해상도 (예: 1920x1080)
    const baseWidth = 1920;
    const baseHeight = 1080;
    const baseZoom = 1;

    // 화면 크기에 따른 줌 계산
    const scaleX = gameWidth / baseWidth;
    const scaleY = gameHeight / baseHeight;

    // 더 작은 스케일을 선택하여 화면에 맞게 조정
    const dynamicZoom = Math.min(scaleX, scaleY) * baseZoom;

    // 최소/최대 줌 제한 (더 확대된 상태로)
    const minZoom = 0.8;
    const maxZoom = 3.0;

    return Math.max(minZoom, Math.min(maxZoom, dynamicZoom));
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const newWidth = gameSize.width;
    const newHeight = gameSize.height;

    // 새로운 줌 계산
    const newZoom = this.calculateCameraZoom(newWidth, newHeight);

    // 줌이 변경된 경우에만 업데이트
    if (Math.abs(this.cameraZoom - newZoom) > 0.01) {
      this.cameraZoom = newZoom;

      // 카메라 줌 업데이트
      this.cameras.main.setZoom(this.cameraZoom);

      console.log("화면 크기 변경으로 인한 줌 업데이트:", this.cameraZoom);
    }
  }

  private createComplexMapBounds() {
    console.log("복잡한 맵 구조 벽 생성 시작");
    const walls = this.physics.add.staticGroup();

    // === 왼쪽 방 벽들 ===
    this.createLeftRoomWalls(walls);

    // === 오른쪽 방 벽들 ===
    this.createRightRoomWalls(walls);

    // === 중간 통로 벽들 ===
    this.createCorridorWalls(walls);

    // 플레이어와 모든 벽 충돌
    this.physics.add.collider(this.player, walls);

    console.log("복잡한 맵 구조 벽 생성 완료");
  }

  private createLeftRoomWalls(walls: Phaser.Physics.Arcade.StaticGroup) {
    console.log("왼쪽 방 벽 생성 중...");

    const wallThickness = 1;
    const leftRoom = {
      left: 64 * this.baseScale,
      right: 176 * this.baseScale,
      top: 64 * this.baseScale,
      bottom: 160 * this.baseScale,
    };

    const roomWidth = leftRoom.right - leftRoom.left;
    const roomHeight = leftRoom.bottom - leftRoom.top;
    const roomCenterX = leftRoom.left + roomWidth / 2;
    const roomCenterY = leftRoom.top + roomHeight / 2;

    // 기본 벽들
    const wallConfigs = [
      {
        x: leftRoom.left - wallThickness / 2,
        y: roomCenterY,
        width: wallThickness,
        height: roomHeight,
      },
      {
        x: roomCenterX,
        y: leftRoom.top - wallThickness / 2,
        width: roomWidth,
        height: wallThickness,
      },
      {
        x: roomCenterX,
        y: leftRoom.bottom + wallThickness / 2,
        width: roomWidth,
        height: wallThickness,
      },
    ];

    wallConfigs.forEach((config) =>
      this.createWall(config.x, config.y, config.width, config.height, walls)
    );

    // 오른쪽 벽 (문 제외)
    const doorStart = this.DOOR_START * this.baseScale;
    const doorEnd = this.DOOR_END * this.baseScale;

    const rightWallConfigs = [
      {
        x: leftRoom.right + wallThickness / 2,
        y: leftRoom.top + (doorStart - leftRoom.top) / 2,
        width: wallThickness,
        height: doorStart - leftRoom.top,
      },
      {
        x: leftRoom.right + wallThickness / 2,
        y: doorEnd + (leftRoom.bottom - doorEnd) / 2,
        width: wallThickness,
        height: leftRoom.bottom - doorEnd - wallThickness,
      },
    ];

    rightWallConfigs.forEach((config) =>
      this.createWall(config.x, config.y, config.width, config.height, walls)
    );
  }

  private createRightRoomWalls(walls: Phaser.Physics.Arcade.StaticGroup) {
    console.log("오른쪽 방 벽 생성 중...");

    const wallThickness = 1;
    const rightRoom = {
      left: 224 * this.baseScale,
      right: 336 * this.baseScale,
      top: 64 * this.baseScale,
      bottom: 176 * this.baseScale,
    };

    const roomWidth = rightRoom.right - rightRoom.left;
    const roomHeight = rightRoom.bottom - rightRoom.top;
    const roomCenterX = rightRoom.left + roomWidth / 2;
    const roomCenterY = rightRoom.top + roomHeight / 2;

    // 기본 벽들
    const wallConfigs = [
      {
        x: rightRoom.right + wallThickness / 2,
        y: roomCenterY,
        width: wallThickness,
        height: roomHeight,
      },
      {
        x: roomCenterX,
        y: rightRoom.top - wallThickness / 2,
        width: roomWidth,
        height: wallThickness,
      },
      {
        x: roomCenterX,
        y: rightRoom.bottom + wallThickness / 2,
        width: roomWidth,
        height: wallThickness,
      },
    ];

    wallConfigs.forEach((config) =>
      this.createWall(config.x, config.y, config.width, config.height, walls)
    );

    // 왼쪽 벽 (문 제외)
    const doorStart = this.DOOR_START * this.baseScale;
    const doorEnd = this.DOOR_END * this.baseScale;

    const leftWallConfigs = [
      {
        x: rightRoom.left - wallThickness / 2,
        y: rightRoom.top + (doorStart - rightRoom.top) / 2,
        width: wallThickness,
        height: doorStart - rightRoom.top,
      },
      {
        x: rightRoom.left - wallThickness / 2,
        y: doorEnd + (rightRoom.bottom - doorEnd) / 2,
        width: wallThickness,
        height: rightRoom.bottom - doorEnd - wallThickness,
      },
    ];

    leftWallConfigs.forEach((config) =>
      this.createWall(config.x, config.y, config.width, config.height, walls)
    );
  }

  private createCorridorWalls(walls: Phaser.Physics.Arcade.StaticGroup) {
    console.log("중간 통로 벽 생성 중...");

    const wallThickness = 1;
    const corridor = {
      left: 177 * this.baseScale,
      right: 224 * this.baseScale,
      top: this.DOOR_START * this.baseScale,
      bottom: this.DOOR_END * this.baseScale,
    };

    const corridorWidth = corridor.right - corridor.left;
    const corridorCenterX = corridor.left + corridorWidth / 2;

    // 통로 위아래 벽들
    const wallConfigs = [
      {
        x: corridorCenterX,
        y: corridor.top - wallThickness / 2,
        width: corridorWidth,
        height: wallThickness,
      },
      {
        x: corridorCenterX,
        y: corridor.bottom + wallThickness / 2,
        width: corridorWidth,
        height: wallThickness,
      },
    ];

    wallConfigs.forEach((config) =>
      this.createWall(config.x, config.y, config.width, config.height, walls)
    );
  }

  // 공통 헬퍼 함수
  private createWall(
    x: number,
    y: number,
    width: number,
    height: number,
    walls: Phaser.Physics.Arcade.StaticGroup
  ) {
    const wall = this.physics.add.staticSprite(x, y, "invisible");
    wall.setSize(width, height);
    wall.setVisible(false);
    walls.add(wall);
    return wall;
  }

  private createPlayerAnimations() {
    // 기본 정지 상태 (현재 프레임 960)
    this.anims.create({
      key: "idle",
      frames: [{key: "character_spritesheet", frame: 960}],
      frameRate: 1,
    });

    // 아래쪽 걷기 (960부터 2-3프레임)
    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("character_spritesheet", {
        start: 960,
        end: 963,
      }),
      frameRate: 8,
      repeat: -1,
    });

    // 오른쪽 걷기 (960 + 33)
    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("character_spritesheet", {
        start: 999,
        end: 1002,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("character_spritesheet", {
        start: 1038,
        end: 1041,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("character_spritesheet", {
        start: 1077,
        end: 1080,
      }),
      frameRate: 8,
      repeat: -1,
    });

    console.log("플레이어 애니메이션 생성 완료");
  }

  update() {
    if (!this.player) return;

    // 캐릭터 이동 속도 증가
    const speed = 400;
    let isMoving = false;

    // 플레이어 움직임과 애니메이션
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setVelocityY(0);
      this.player.play("walk_left", true);
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setVelocityY(0);
      this.player.play("walk_right", true);
      isMoving = true;
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityX(0);
      this.player.setVelocityY(-speed);
      this.player.play("walk_up", true);
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityX(0);
      this.player.setVelocityY(speed);
      this.player.play("walk_down", true);
      isMoving = true;
    } else {
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
            debug: true, // 디버그 모드 켜기
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
