import React, {useEffect, useRef} from "react";
import Phaser from "phaser";

class PortfolioScene extends Phaser.Scene {
  constructor() {
    super({key: "PortfolioScene"});
  }

  preload() {
    console.log("에셋 로딩 시작...");

    // 실제 맵 이미지 로드 시도
    this.load.image("room_map", "assets/room_map.png");

    // 로드 완료/실패 이벤트
    this.load.on("complete", () => {
      console.log("모든 에셋 로드 완료");
    });

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("에셋 로드 실패:", file.key);
    });
  }

  create() {
    console.log("씬 생성 시작...");

    // 배경 이미지 표시 시도
    if (this.textures.exists("room_map")) {
      console.log("실제 맵 이미지 사용");
      const roomMap = this.add.image(800, 300, "room_map");

      roomMap.setScale(4); // 4배 확대
    } else {
      console.log("대체 배경 생성");
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
        backgroundColor: "#7C3AED",
        scene: PortfolioScene,
        width: 2000,
        height: 3000,
        scale: {
          mode: Phaser.Scale.MAX_ZOOM,
          width: 2000,
          height: 3000,
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
      {/* <div className="text-center"> */}
      <div ref={gameRef} />
      {/* </div> */}
    </div>
  );
};

export default PhaserPortfolio;
