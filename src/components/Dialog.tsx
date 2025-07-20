import React, { useState, useEffect } from 'react';
import type { MessageContent } from '../types/game';

interface DialogProps {
  isOpen: boolean;
  content: MessageContent | null;
  onClose: () => void;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, content, onClose }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && content) {
      setDisplayText('');
      setCurrentIndex(0);
      setIsTyping(true);

      // JSX를 텍스트로 변환
      const textContent = extractTextFromContent(content);

      // 타이핑 애니메이션
      const typingInterval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= textContent.length) {
            setIsTyping(false);
            clearInterval(typingInterval);
            return prev;
          }
          setDisplayText(textContent.substring(0, prev + 1));
          return prev + 1;
        });
      }, 25); // 빠른 타이핑 속도

      return () => clearInterval(typingInterval);
    }
  }, [isOpen, content]);

  const extractTextFromContent = (content: MessageContent): string => {
    if (typeof content === 'string') {
      return content;
    }

    // React Element에서 텍스트만 추출
    const extractText = (element: React.ReactElement): string => {
      let result = '';

      React.Children.forEach(element.props.children, (child) => {
        if (typeof child === 'string') {
          result += child;
        } else if (typeof child === 'number') {
          result += child.toString();
        } else if (React.isValidElement(child)) {
          if (child.type === 'br' || child.type === 'Br') {
            result += '\n';
          } else {
            result += extractText(child);
          }
        }
      });

      return result;
    };

    return extractText(content);
  };

  const renderContent = () => {
    if (!content || isTyping) {
      return <span>{displayText}</span>;
    }

    // 타이핑 완료 후 실제 JSX 렌더링
    return content;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '25%',
        backgroundColor: 'white',
        border: '3px solid black',
        borderRadius: '8px 8px 0 0',
        zIndex: 10000,
        padding: '20px',
        fontFamily: 'monospace, "Courier New", Consolas',
        fontSize: '18px',
        lineHeight: '1.4',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap', // \n을 줄바꿈으로 처리
        }}
      >
        {renderContent()}
      </div>

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          backgroundColor: '#e0e0e0',
          border: 'none',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d0d0d0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
      >
        Close
      </button>
    </div>
  );
};

export default Dialog;
