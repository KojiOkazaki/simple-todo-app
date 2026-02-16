declare module '../../libs/talkinghead.mjs' {
  export class TalkingHead {
    constructor(container: HTMLElement, options?: any);
    showAvatar(config: any, onProgress?: (ev: any) => void): Promise<void>;
    setView(view: string, distance?: number, rotateY?: number): void;
    speakText(text: string, options?: any): Promise<void>;
    playAudio(url: string, options?: any): Promise<void>;
    stop(): void;
  }
}
