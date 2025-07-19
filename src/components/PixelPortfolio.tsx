import React, { useCallback, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PortfolioScene from '../game/PortfolioScene';
import Dialog from './Dialog';
import { useDialog } from '../hooks/useDialog';

const PhaserPortfolio: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const { isOpen, content, isActive, showDialog, closeDialog } = useDialog();

  const connectDialogSystem = useCallback(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('PortfolioScene') as any;
      if (scene && scene.setDialogSystem) {
        console.log('Dialog 시스템 연결 중...', scene);
        scene.setDialogSystem({
          showDialog,
          isActive,
        });
        console.log('Dialog 시스템 연결 완료');
        return true;
      } else {
        console.warn('PortfolioScene이 아직 준비되지 않았습니다.');
        return false;
      }
    }
    return false;
  }, [showDialog, isActive]);

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      console.log('Phaser 게임 초기화...');

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        backgroundColor: '#3e245a',
        scene: PortfolioScene,
        physics: {
          default: 'arcade',
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
      console.log('Phaser 게임 초기화 완료');

      // 여러 번 시도해서 연결
      let attempts = 0;
      const maxAttempts = 10;
      const tryConnect = () => {
        attempts++;
        const connected = connectDialogSystem();

        if (!connected && attempts < maxAttempts) {
          console.log(`Dialog 시스템 연결 시도 ${attempts}/${maxAttempts}`);
          setTimeout(tryConnect, 200); // 200ms 간격으로 재시도
        } else if (connected) {
          console.log('Dialog 시스템 연결 성공!');
        } else {
          console.error('Dialog 시스템 연결 실패 - 최대 시도 횟수 초과');
        }
      };

      // 첫 연결 시도
      setTimeout(tryConnect, 100);
    }

    return () => {
      if (phaserGameRef.current) {
        console.log('Phaser 게임 정리...');
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div ref={gameRef} />
      <Dialog isOpen={isOpen} content={content} onClose={closeDialog} />
    </div>
  );
};

export default PhaserPortfolio;
