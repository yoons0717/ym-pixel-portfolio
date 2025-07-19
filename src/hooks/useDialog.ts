import { useState, useCallback } from 'react';
import type { MessageContent } from '../game/GameConfig';

export const useDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<MessageContent | null>(null);
  const [isActive, setIsActive] = useState(false);

  const showDialog = useCallback((newContent: MessageContent) => {
    setContent(newContent);
    setIsOpen(true);
    setIsActive(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setIsActive(false);
    // 애니메이션 완료 후 content 초기화
    setTimeout(() => setContent(null), 300);
  }, []);

  return {
    isOpen,
    content,
    isActive, // 게임에서 플레이어 움직임 제어용
    showDialog,
    closeDialog,
  };
};
