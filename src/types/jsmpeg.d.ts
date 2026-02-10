declare module '@cycjimmy/jsmpeg-player' {
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
    onPlay?: (player: Player) => void;
    onPause?: (player: Player) => void;
    onEnded?: (player: Player) => void;
    onStalled?: (player: Player) => void;
    onSourceEstablished?: (source: unknown) => void;
    onSourceCompleted?: (source: unknown) => void;
  }

  interface Player {
    destroy(): void;
    play(): void;
    pause(): void;
    stop(): void;
    volume: number;
    source?: {
      socket?: WebSocket;
      close(): void;
    };
  }

  interface JSMpegNamespace {
    Player: {
      new (url: string, options?: PlayerOptions): Player;
    };
  }

  const JSMpeg: JSMpegNamespace;
  export default JSMpeg;
}
