declare module 'jsmpeg' {
  interface PlayerOptions {
    canvas?: HTMLCanvasElement;
    autoplay?: boolean;
    audio?: boolean;
    loop?: boolean;
    videoBufferSize?: number;
    audioBufferSize?: number;
    preserveDrawingBuffer?: boolean;
    progressive?: boolean;
    throttled?: boolean;
    chunkSize?: number;

    onVideoDecode?: (decoder: unknown, time: number) => void;
    onAudioDecode?: (decoder: unknown, time: number) => void;
    onPlay?: (player: unknown) => void;
    onPause?: (player: unknown) => void;
    onEnded?: (player: unknown) => void;
    onStalled?: (player: unknown) => void;
    onSourceEstablished?: (source: unknown) => void;
    onSourceCompleted?: (source: unknown) => void;
  }

  interface Player {
    destroy(): void;
    play(): void;
    pause(): void;
    stop(): void;
    volume: number;
  }

  interface PlayerConstructor {
    new (url: string, options?: PlayerOptions): Player;
  }

  const JSMpeg: PlayerConstructor;
  export default JSMpeg;
}
