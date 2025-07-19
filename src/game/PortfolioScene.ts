import Phaser from 'phaser';
import { WallSystem } from './WallSystem';
import { MAP_STRUCTURE } from './GameConfig';

export default class PortfolioScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly baseScale: number = 6;
  private cameraZoom!: number;
  private wallSystem!: WallSystem;
  private lastInteractedFurniture: string | null = null;
  private interactionCooldown: boolean = false;

  // React Dialog 연결
  private dialogSystem: any = null;

  constructor() {
    super({ key: 'PortfolioScene' });
  }

  // React에서 Dialog 시스템 주입
  public setDialogSystem(dialogSystem: any) {
    console.log('setDialogSystem 호출됨:', dialogSystem);
    this.dialogSystem = dialogSystem;
  }

  preload() {
    console.log('에셋 로딩 시작...');

    this.load.image('room_map', 'assets/room_map.png');
    this.load.spritesheet('character_spritesheet', 'assets/character_spritesheet.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.on('ready', () => {
      this.add.graphics().generateTexture('invisible', 1, 1);
    });

    this.load.on('complete', () => {
      console.log('모든 에셋 로드 완료');
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('에셋 로드 실패:', file.key);
    });
  }

  create() {
    const { width: gameWidth, height: gameHeight } = this.scale;
    console.log('씬 생성 시작...', gameWidth, gameHeight);

    this.initializeSystems();
    this.initializeCamera(gameWidth, gameHeight);
    this.setupMap();
    this.createPlayer();
    this.setupPhysics();
    this.createMapBounds();
    this.createPlayerAnimations();
    this.setupControls();

    console.log('PortfolioScene 생성 완료');
  }

  private initializeSystems() {
    this.wallSystem = new WallSystem(this, this.baseScale);
  }

  private initializeCamera(gameWidth: number, gameHeight: number) {
    this.cameraZoom = this.calculateCameraZoom(gameWidth, gameHeight);
    console.log('계산된 카메라 줌:', this.cameraZoom);
    this.scale.on('resize', this.handleResize, this);
  }

  private setupMap() {
    const roomMap = this.add.image(0, 0, 'room_map');
    roomMap.setOrigin(0, 0);
    roomMap.setScale(this.baseScale);

    const { displayWidth, displayHeight } = roomMap;
    console.log('맵 표시 크기:', displayWidth, displayHeight);

    this.cameras.main.setBounds(0, 0, displayWidth, displayHeight);
    this.cameras.main.setZoom(this.cameraZoom);
    this.physics.world.setBounds(0, 0, displayWidth, displayHeight);
  }

  private createPlayer() {
    const { x, y } = MAP_STRUCTURE.PLAYER_START;
    this.player = this.physics.add.sprite(
      x * this.baseScale,
      y * this.baseScale,
      'character_spritesheet',
      960
    );
    this.player.setOrigin(0, 0);
    this.player.setScale(this.baseScale);
    this.player.body!.setCollideWorldBounds(false);

    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    console.log('플레이어 생성 완료:', this.player.x, this.player.y);
  }

  private setupPhysics() {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  private createMapBounds() {
    const { furniture } = this.wallSystem.createMapBounds(this.player);
    this.physics.add.collider(
      this.player,
      furniture,
      this.handleFurnitureCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    console.log('가구 충돌 설정 완료, 가구 개수:', furniture.children.entries.length);
  }

  private handleFurnitureCollision = (
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    furnitureItem: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) => {
    console.log('가구 충돌 감지!');

    // React Dialog가 활성화되어 있거나 쿨다운 중이면 무시
    if (this.dialogSystem?.isActive || this.interactionCooldown) {
      console.log(
        '다이얼로그 활성화 또는 쿨다운 중:',
        this.dialogSystem?.isActive,
        this.interactionCooldown
      );
      return;
    }

    const furniture = furnitureItem as Phaser.Physics.Arcade.Sprite;
    const furnitureName = furniture.getData('name') as string;

    if (this.lastInteractedFurniture === furnitureName) {
      console.log('같은 가구와 연속 상호작용 방지:', furnitureName);
      return;
    }

    console.log(`가구 ${furnitureName}에 충돌함`);

    this.player.setVelocity(0, 0);
    this.player.play('idle', true);

    this.lastInteractedFurniture = furnitureName;
    this.interactionCooldown = true;

    const message = furniture.getData('message');
    console.log('가구 메시지:', message);

    if (this.dialogSystem) {
      console.log('다이얼로그 시스템으로 메시지 전송 중...');
      this.dialogSystem.showDialog(message);
    } else {
      console.error('다이얼로그 시스템이 연결되지 않았습니다!');
    }

    this.time.delayedCall(2000, () => {
      this.interactionCooldown = false;
      console.log('상호작용 쿨다운 해제');
    });
  };

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
      console.log('화면 크기 변경으로 인한 줌 업데이트:', this.cameraZoom);
    }
  };

  private createPlayerAnimations() {
    const animations = [
      {
        key: 'idle',
        frames: [{ key: 'character_spritesheet', frame: 960 }],
        frameRate: 1,
      },
      { key: 'walk_down', start: 960, end: 963, frameRate: 8, repeat: -1 },
      { key: 'walk_right', start: 999, end: 1002, frameRate: 8, repeat: -1 },
      { key: 'walk_up', start: 1038, end: 1041, frameRate: 8, repeat: -1 },
      { key: 'walk_left', start: 1077, end: 1080, frameRate: 8, repeat: -1 },
    ];

    animations.forEach((anim) => {
      if (anim.key === 'idle') {
        this.anims.create({
          key: anim.key,
          frames: anim.frames,
          frameRate: anim.frameRate,
        });
      } else {
        this.anims.create({
          key: anim.key,
          frames: this.anims.generateFrameNumbers('character_spritesheet', {
            start: anim.start!,
            end: anim.end!,
          }),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      }
    });

    console.log('플레이어 애니메이션 생성 완료');
  }

  private resetInteractionState() {
    this.lastInteractedFurniture = null;
  }

  update() {
    if (!this.player) return;

    // React Dialog가 활성화되어 있으면 모든 움직임 차단
    if (this.dialogSystem?.isActive) {
      this.player.setVelocity(0, 0);
      this.player.play('idle', true);
      return;
    }

    // 다이얼로그가 닫혔을 때 상호작용 상태 초기화
    if (this.lastInteractedFurniture && !this.dialogSystem?.isActive) {
      this.resetInteractionState();
    }

    const speed = 400;
    const movements = {
      left: { x: -speed, y: 0, anim: 'walk_left' },
      right: { x: speed, y: 0, anim: 'walk_right' },
      up: { x: 0, y: -speed, anim: 'walk_up' },
      down: { x: 0, y: speed, anim: 'walk_down' },
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
      this.player.play('idle', true);
    }
  }
}
