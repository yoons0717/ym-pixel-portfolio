import React from 'react';
import type { MessageContent } from '../types/game';

export interface DialogState {
  isOpen: boolean;
  fullText: string;
  isTyping: boolean;
}

interface LinkData {
  text: string;
  url: string;
  startIndex: number;
  endIndex: number;
}

interface LinkProps {
  href: string;
  children?: React.ReactNode;
}

interface ElementWithChildren {
  children?: React.ReactNode;
}

export class DialogSystem {
  private scene: Phaser.Scene;
  private dialogState: DialogState = {
    isOpen: false,
    fullText: '',
    isTyping: false,
  };
  private dialogBox?: Phaser.GameObjects.Graphics;
  private dialogText?: Phaser.GameObjects.Text;
  private closeButton?: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  private linkButtons: (Phaser.GameObjects.Text | Phaser.GameObjects.Graphics)[] = [];
  private currentCharIndex: number = 0;
  private autoCloseTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public get isOpen(): boolean {
    return this.dialogState.isOpen;
  }

  public get isActive(): boolean {
    return this.dialogState.isOpen || this.dialogState.isTyping;
  }

  public showDialog(content: MessageContent) {
    console.log('showDialog 호출됨, 컨텐츠:', content);

    // 기존 다이얼로그가 있으면 정리
    if (this.dialogState.isOpen) {
      this.closeDialog();
    }

    const text = this.parseMessageContent(content);

    this.dialogState = {
      isOpen: true,
      fullText: text,
      isTyping: false,
    };

    this.currentCharIndex = 0;

    try {
      this.createDialogUI();
      this.startTyping();
      console.log('다이얼로그 UI 생성 및 타이핑 시작 완료');
    } catch (error) {
      console.error('다이얼로그 생성 중 오류:', error);
    }
  }

  // JSX Element를 파싱하여 텍스트와 링크 정보 추출
  private parseMessageContent(content: MessageContent): string {
    if (typeof content === 'string') {
      return content;
    }

    // React Element를 처리
    return this.extractTextFromJSX(content);
  }

  private extractTextFromJSX(element: React.ReactElement): string {
    let result = '';

    const processChildren = (children: React.ReactNode): void => {
      React.Children.forEach(children, (child) => {
        if (typeof child === 'string') {
          result += child;
        } else if (typeof child === 'number') {
          result += child.toString();
        } else if (React.isValidElement(child)) {
          if (child.type === 'a') {
            // 타입 단언을 사용하여 안전하게 props 접근
            const linkElement = child as React.ReactElement<LinkProps>;
            const href = linkElement.props.href;
            const text = this.extractTextFromJSX(linkElement);
            result += `[${text}](${href})`;
          } else {
            // Fragment나 다른 요소들 처리
            const childElement = child as React.ReactElement<ElementWithChildren>;
            if (childElement.props?.children) {
              processChildren(childElement.props.children);
            }
          }
        }
      });
    };

    // element의 props도 타입 단언 사용
    const elementProps = element.props as ElementWithChildren;
    if (elementProps.children) {
      processChildren(elementProps.children);
    }

    return result;
  }

  public handleInput() {
    // ESC 키로 강제 닫기 기능 추가 가능
  }

  private createDialogUI() {
    const { width, height } = this.scene.cameras.main;
    const dialogWidth = width;
    const dialogHeight = height * 0.25; // 링크 버튼이 없으므로 다시 줄임
    const dialogX = 0;
    const dialogY = height - dialogHeight;

    // 다이얼로그 배경
    this.dialogBox = this.scene.add.graphics();
    this.dialogBox.setScrollFactor(0);
    this.dialogBox.setDepth(10000);

    // 배경 (흰색)
    this.dialogBox.fillStyle(0xffffff, 1);
    this.dialogBox.fillRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, 8);

    // 테두리 (검은색)
    this.dialogBox.lineStyle(3, 0x000000, 1);
    this.dialogBox.strokeRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, 8);

    // 다이얼로그 텍스트 (픽셀 폰트 스타일 - 선명하게)
    this.dialogText = this.scene.add.text(dialogX + 20, dialogY + 20, '', {
      fontSize: '18px',
      color: '#000000',
      fontFamily: "monospace, 'Courier New', Consolas",
      wordWrap: { width: dialogWidth - 40 },
      lineSpacing: 8,
      // 폰트 선명도 개선
      resolution: 2, // 해상도 2배로 증가
    });
    this.dialogText.setScrollFactor(0);
    this.dialogText.setDepth(10001);

    // 닫기 버튼
    this.closeButton = this.scene.add.text(
      dialogX + dialogWidth - 80,
      dialogY + dialogHeight - 40,
      'Close',
      {
        fontSize: '16px',
        color: '#333333',
        fontFamily: "monospace, 'Courier New', Consolas",
        backgroundColor: '#e0e0e0',
        padding: { x: 12, y: 6 },
        resolution: 2, // 폰트 선명도 개선
      }
    );
    this.closeButton.setScrollFactor(0);
    this.closeButton.setDepth(10001);
    this.closeButton.setInteractive();
    this.closeButton.on('pointerdown', () => this.closeDialog());

    // 호버 효과
    this.closeButton.on('pointerover', () => {
      this.closeButton?.setStyle({ backgroundColor: '#d0d0d0' });
    });
    this.closeButton.on('pointerout', () => {
      this.closeButton?.setStyle({ backgroundColor: '#e0e0e0' });
    });
  }

  private parseLinks(text: string): { cleanText: string; links: LinkData[] } {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: LinkData[] = [];
    let cleanText = text;
    let match;
    let offset = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const linkText = match[1];
      const url = match[2];

      const startIndex = match.index - offset;
      const endIndex = startIndex + linkText.length;

      links.push({
        text: linkText,
        url: url,
        startIndex: startIndex,
        endIndex: endIndex,
      });

      cleanText = cleanText.replace(fullMatch, linkText);
      offset += fullMatch.length - linkText.length;
    }

    return { cleanText, links };
  }

  private startTyping() {
    console.log('startTyping 시작');

    this.dialogState.isTyping = true;
    this.currentCharIndex = 0;

    this.clearLinkButtons();

    if (this.dialogText) {
      this.dialogText.setText('');
    }

    const { cleanText, links } = this.parseLinks(this.dialogState.fullText);
    console.log('파싱된 텍스트:', cleanText);
    console.log('파싱된 링크:', links);
    console.log('원본 텍스트:', this.dialogState.fullText);

    this.typingTimer = this.scene.time.addEvent({
      delay: 5, // 빠른 타이핑 속도
      callback: () => {
        if (this.currentCharIndex < cleanText.length) {
          this.currentCharIndex++;
          this.updateDialogText(cleanText, links);
        } else {
          console.log('타이핑 완료');
          this.dialogState.isTyping = false;
          this.typingTimer?.destroy();

          // 타이핑 완료 후 링크 오버레이 최종 업데이트
          if (links.length > 0) {
            console.log('최종 링크 오버레이 생성');
            this.createLinkOverlays(cleanText, links);
          }
        }
      },
      repeat: cleanText.length,
    });
  }

  private updateDialogText(cleanText: string, links?: LinkData[]) {
    if (!this.dialogText) return;

    const displayText = cleanText.substring(0, this.currentCharIndex);

    if (links && links.length > 0) {
      // 링크가 있는 경우 오버레이 방식 사용
      this.dialogText.setText(displayText);
      this.createLinkOverlays(displayText, links);
    } else {
      this.dialogText.setText(displayText);
    }
  }

  private createLinkOverlays(displayText: string, links: LinkData[]) {
    // 기존 링크 오버레이 제거
    this.clearLinkButtons();

    if (!this.dialogText) return; // null 체크 추가

    const { height } = this.scene.cameras.main;
    const dialogHeight = height * 0.25;
    const dialogX = 0;
    const dialogY = height - dialogHeight;

    // 텍스트 스타일 정보 가져오기
    const textStyle = this.dialogText.style;
    const fontSize = this.parseFontSize(textStyle.fontSize);
    const fontFamily = textStyle.fontFamily || 'monospace';

    links.forEach((link) => {
      if (this.currentCharIndex > link.startIndex) {
        const linkEnd = Math.min(link.endIndex, this.currentCharIndex);
        if (linkEnd > link.startIndex) {
          const linkText = displayText.substring(link.startIndex, linkEnd);

          // 더 정확한 위치 계산
          const textBeforeLink = displayText.substring(0, link.startIndex);
          const linkPosition = this.calculateTextPosition(textBeforeLink, fontSize);

          const linkX = dialogX + 20 + linkPosition.x;
          const linkY = dialogY + 20 + linkPosition.y;

          // 파란색 밑줄 텍스트 오버레이
          const linkOverlay = this.scene.add.text(linkX, linkY, linkText, {
            fontSize: fontSize.toString() + 'px',
            color: '#0066cc',
            fontFamily: fontFamily,
            resolution: 2,
          });

          // 밑줄 효과를 위한 별도 그래픽
          const underline = this.scene.add.graphics();
          underline.setScrollFactor(0);
          underline.setDepth(10002);
          underline.lineStyle(1, 0x0066cc);

          // 텍스트 너비 계산하여 밑줄 그리기
          const textMetrics = this.scene.add.text(0, 0, linkText, {
            fontSize: fontSize.toString() + 'px',
            fontFamily: fontFamily,
          });
          const textWidth = textMetrics.width;
          textMetrics.destroy();

          // 밑줄 그리기
          underline.moveTo(linkX, linkY + fontSize + 2);
          underline.lineTo(linkX + textWidth, linkY + fontSize + 2);
          underline.strokePath();

          linkOverlay.setScrollFactor(0);
          linkOverlay.setDepth(10002); // 기본 텍스트보다 위에
          linkOverlay.setInteractive();

          // 호버 효과
          linkOverlay.on('pointerover', () => {
            linkOverlay.setStyle({ color: '#0052cc' });
            underline.clear();
            underline.lineStyle(1, 0x0052cc);
            underline.moveTo(linkX, linkY + fontSize + 2);
            underline.lineTo(linkX + textWidth, linkY + fontSize + 2);
            underline.strokePath();
          });

          linkOverlay.on('pointerout', () => {
            linkOverlay.setStyle({ color: '#0066cc' });
            underline.clear();
            underline.lineStyle(1, 0x0066cc);
            underline.moveTo(linkX, linkY + fontSize + 2);
            underline.lineTo(linkX + textWidth, linkY + fontSize + 2);
            underline.strokePath();
          });

          // 클릭 이벤트
          linkOverlay.on('pointerdown', () => {
            console.log(`링크 클릭: ${link.url}`);
            window.open(link.url, '_blank');
          });

          this.linkButtons.push(linkOverlay);
          this.linkButtons.push(underline); // Graphics 객체도 배열에 추가
        }
      }
    });
  }

  // 폰트 사이즈를 안전하게 파싱하는 헬퍼 메서드
  private parseFontSize(fontSize: string | number): number {
    if (typeof fontSize === 'number') {
      return fontSize;
    }
    if (typeof fontSize === 'string') {
      const parsed = parseInt(fontSize.replace('px', ''));
      return isNaN(parsed) ? 18 : parsed; // 기본값 18px
    }
    return 18; // 기본값
  }

  // 텍스트 위치를 더 정확하게 계산하는 헬퍼 메서드
  private calculateTextPosition(
    textBeforeLink: string,
    fontSize: number
  ): { x: number; y: number } {
    const lineSpacing = 8; // 고정값 사용

    // 개행 문자를 기준으로 줄 나누기
    const lines = textBeforeLink.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex];

    // monospace 폰트의 문자 너비 (폰트 크기에 비례)
    const charWidth = fontSize * 0.6; // 18px 기준 약 11px

    return {
      x: currentLineText.length * charWidth,
      y: currentLineIndex * (fontSize + lineSpacing),
    };
  }

  private clearLinkButtons() {
    this.linkButtons.forEach((button) => {
      if (button && button.destroy) {
        button.destroy();
      }
    });
    this.linkButtons = [];
  }

  private closeDialog() {
    this.dialogState.isOpen = false;
    this.dialogState.isTyping = false;

    this.dialogBox?.destroy();
    this.dialogText?.destroy();
    this.closeButton?.destroy();
    this.clearLinkButtons();
    this.typingTimer?.destroy();
    this.autoCloseTimer?.destroy();

    // 메모리 정리
    this.dialogBox = undefined;
    this.dialogText = undefined;
    this.closeButton = undefined;
    this.typingTimer = undefined;
    this.autoCloseTimer = undefined;
    this.currentCharIndex = 0;
  }

  public destroy() {
    this.closeDialog();
  }
}
