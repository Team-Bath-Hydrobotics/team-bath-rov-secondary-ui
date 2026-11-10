import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

// JSMpeg opens a websocket and decodes video, so the player is replaced with
// a mock that records how each player was created. The tests drive the
// connection by calling the callbacks the provider passed in its options.
const { PlayerMock, players } = vi.hoisted(() => {
  interface FakePlayerOptions {
    canvas?: HTMLCanvasElement;
    onSourceEstablished?: (source: unknown) => void;
    onVideoDecode?: (decoder: unknown, time: number) => void;
    [option: string]: unknown;
  }

  interface FakePlayer {
    url: string;
    options: FakePlayerOptions;
    destroy: ReturnType<typeof vi.fn<() => void>>;
  }

  const players: FakePlayer[] = [];

  // A regular function (not an arrow) so the mock can be called with `new`.
  const PlayerMock = vi.fn(function (url: string, options: FakePlayerOptions) {
    const player: FakePlayer = { url, options, destroy: vi.fn<() => void>() };
    players.push(player);
    return player;
  });

  return { PlayerMock, players };
});

vi.mock('@cycjimmy/jsmpeg-player', () => ({
  default: { Player: PlayerMock },
}));

import { useAppStateContext } from '../context/AppStateContext';
import { useVideoStreamContext } from '../context/VideoStreamContext';
import { AppStateProvider } from './AppStateProvider';
import { VideoStreamProvider } from './VideoStreamProvider';

const COPILOT = true;
const DETECTION = false;

/** How long a key stays locked against duplicate registrations. */
const INITIALISING_WINDOW_MS = 1500;

const makeCanvas = () => document.createElement('canvas');

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppStateProvider>
    <VideoStreamProvider>{children}</VideoStreamProvider>
  </AppStateProvider>
);

const renderVideoStream = () =>
  renderHook(() => ({ video: useVideoStreamContext(), app: useAppStateContext() }), { wrapper });

type VideoStreamResult = ReturnType<typeof renderVideoStream>['result'];

const register = (
  result: VideoStreamResult,
  cameraId: number,
  canvas: HTMLCanvasElement | null,
  isCopilot: boolean,
) => {
  act(() => {
    result.current.video.registerCamera(cameraId, canvas, isCopilot);
  });
};

const establishSource = (playerIndex: number) => {
  act(() => {
    players[playerIndex].options.onSourceEstablished?.(null);
  });
};

const decodeFrame = (playerIndex: number) => {
  act(() => {
    players[playerIndex].options.onVideoDecode?.(null, 0);
  });
};

const copilotStatus = (result: VideoStreamResult, cameraId: number) =>
  result.current.app.state.camerasCopilot[cameraId].connectionStatus;

const detectionStatus = (result: VideoStreamResult, cameraId: number) =>
  result.current.app.state.camerasDetection[cameraId].connectionStatus;

describe('VideoStreamProvider', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Keep the websocket URL independent of any local .env file.
    vi.stubEnv('VITE_WS_SERVER_URL', '');

    players.length = 0;
    PlayerMock.mockClear();

    // The provider logs every bind/teardown.
    vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('throws when rendered outside AppStateProvider', () => {
    // React logs the thrown error; silence it to keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <VideoStreamProvider>
          <p>child content</p>
        </VideoStreamProvider>,
      ),
    ).toThrow('useAppStateContext must be used within a AppStateProvider');
  });

  it('keeps the same context value when app state changes', () => {
    // CameraTile re-registers its canvas whenever registerCamera changes, so a
    // new identity on every status update would reconnect in a loop.
    const { result } = renderVideoStream();
    const first = result.current.video;

    register(result, 1, makeCanvas(), COPILOT);
    establishSource(0);
    act(() => {
      result.current.app.toggleCamera(2, COPILOT);
    });

    expect(result.current.video).toBe(first);
    expect(result.current.video.registerCamera).toBe(first.registerCamera);
    expect(result.current.video.registerFrameCallback).toBe(first.registerFrameCallback);
  });

  describe('registering a canvas', () => {
    it('creates a player for the canvas with the streaming options', () => {
      const canvas = makeCanvas();
      const { result } = renderVideoStream();

      register(result, 1, canvas, COPILOT);

      expect(PlayerMock).toHaveBeenCalledTimes(1);
      expect(players[0].options).toMatchObject({
        canvas,
        autoplay: true,
        audio: false,
        videoBufferSize: 512 * 1024,
        preserveDrawingBuffer: true,
      });
    });

    it.each([
      ['adds the camera id to the base port', '', 1, 'ws://localhost:50001/'],
      ['uses a different port per camera', '', 4, 'ws://localhost:50004/'],
      ['uses the configured host and port', 'ws://rov.local:9000', 2, 'ws://rov.local:9002/'],
      ['assumes port 80 for ws without a port', 'ws://rov.local', 2, 'ws://rov.local:82/'],
      [
        'assumes port 443 for wss without a port',
        'wss://rov.example.com',
        1,
        'wss://rov.example.com:444/',
      ],
      [
        'drops any path, query and hash',
        'ws://rov.local:9000/stream?quality=high#feed',
        3,
        'ws://rov.local:9003/',
      ],
    ])('%s', (_name, wsServerUrl, cameraId, expectedUrl) => {
      vi.stubEnv('VITE_WS_SERVER_URL', wsServerUrl);
      const { result } = renderVideoStream();

      register(result, cameraId, makeCanvas(), COPILOT);

      expect(players[0].url).toBe(expectedUrl);
    });

    it('marks a copilot camera as connecting without touching detection', () => {
      const { result } = renderVideoStream();

      register(result, 1, makeCanvas(), COPILOT);

      expect(copilotStatus(result, 1)).toBe('connecting');
      expect(detectionStatus(result, 1)).toBeUndefined();
    });

    it('marks a detection camera as connecting without touching copilot', () => {
      const { result } = renderVideoStream();

      register(result, 1, makeCanvas(), DETECTION);

      expect(detectionStatus(result, 1)).toBe('connecting');
      expect(copilotStatus(result, 1)).toBeUndefined();
    });

    it('marks the camera as connected once the source is established', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);

      establishSource(0);

      expect(copilotStatus(result, 1)).toBe('connected');
    });

    it('marks the camera as connected on the first decoded frame', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), DETECTION);

      decodeFrame(0);

      expect(detectionStatus(result, 1)).toBe('connected');
    });

    it('keeps separate connections for the copilot and detection views of a camera', () => {
      const { result } = renderVideoStream();

      register(result, 1, makeCanvas(), COPILOT);
      register(result, 1, makeCanvas(), DETECTION);
      establishSource(1);

      expect(PlayerMock).toHaveBeenCalledTimes(2);
      expect(copilotStatus(result, 1)).toBe('connecting');
      expect(detectionStatus(result, 1)).toBe('connected');
    });

    it('keeps separate connections for different cameras', () => {
      const { result } = renderVideoStream();

      register(result, 1, makeCanvas(), COPILOT);
      register(result, 2, makeCanvas(), COPILOT);

      expect(players.map((player) => player.url)).toEqual([
        'ws://localhost:50001/',
        'ws://localhost:50002/',
      ]);
    });
  });

  describe('registering the same camera again', () => {
    it('ignores a second registration while the first is still initialising', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);

      register(result, 1, makeCanvas(), COPILOT);

      expect(PlayerMock).toHaveBeenCalledTimes(1);
      expect(players[0].destroy).not.toHaveBeenCalled();
    });

    it('still ignores it just before the initialising window ends', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);

      vi.advanceTimersByTime(INITIALISING_WINDOW_MS - 1);
      register(result, 1, makeCanvas(), COPILOT);

      expect(PlayerMock).toHaveBeenCalledTimes(1);
    });

    it('replaces the player once the initialising window has passed', () => {
      const secondCanvas = makeCanvas();
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);

      vi.advanceTimersByTime(INITIALISING_WINDOW_MS);
      register(result, 1, secondCanvas, COPILOT);

      expect(players[0].destroy).toHaveBeenCalledTimes(1);
      expect(PlayerMock).toHaveBeenCalledTimes(2);
      expect(players[1].options.canvas).toBe(secondCanvas);
      expect(copilotStatus(result, 1)).toBe('connecting');
    });

    it('replaces the player straight away once it has connected', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);
      establishSource(0);

      register(result, 1, makeCanvas(), COPILOT);

      expect(players[0].destroy).toHaveBeenCalledTimes(1);
      expect(PlayerMock).toHaveBeenCalledTimes(2);
      expect(copilotStatus(result, 1)).toBe('connecting');
    });
  });

  describe('unregistering a canvas', () => {
    it('destroys the player and marks the camera as disconnected', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);
      establishSource(0);

      register(result, 1, null, COPILOT);

      expect(players[0].destroy).toHaveBeenCalledTimes(1);
      expect(copilotStatus(result, 1)).toBe('disconnected');
    });

    it('only tears down the view that was unregistered', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);
      register(result, 1, makeCanvas(), DETECTION);
      establishSource(0);
      establishSource(1);

      register(result, 1, null, DETECTION);

      expect(players[0].destroy).not.toHaveBeenCalled();
      expect(players[1].destroy).toHaveBeenCalledTimes(1);
      expect(copilotStatus(result, 1)).toBe('connected');
      expect(detectionStatus(result, 1)).toBe('disconnected');
    });

    it('does nothing when the camera was never registered', () => {
      const { result } = renderVideoStream();
      const stateBefore = result.current.app.state;

      register(result, 1, null, COPILOT);

      expect(PlayerMock).not.toHaveBeenCalled();
      expect(result.current.app.state).toBe(stateBefore);
    });

    it('does nothing the second time the same camera is unregistered', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);
      register(result, 1, null, COPILOT);
      const stateBefore = result.current.app.state;

      register(result, 1, null, COPILOT);

      expect(players[0].destroy).toHaveBeenCalledTimes(1);
      expect(result.current.app.state).toBe(stateBefore);
    });

    it('warns and still marks the camera as disconnected if destroying the player throws', () => {
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), COPILOT);
      establishSource(0);
      players[0].destroy.mockImplementation(() => {
        throw new Error('already destroyed');
      });

      register(result, 1, null, COPILOT);

      expect(warnSpy).toHaveBeenCalledWith('Error destroying player for copilot_1');
      expect(copilotStatus(result, 1)).toBe('disconnected');
    });
  });

  describe('frame callbacks', () => {
    it('calls the registered callback with the canvas for every decoded frame', () => {
      const canvas = makeCanvas();
      const onFrame = vi.fn<(canvas: HTMLCanvasElement) => void>();
      const { result } = renderVideoStream();
      register(result, 1, canvas, DETECTION);
      result.current.video.registerFrameCallback(1, DETECTION, onFrame);

      decodeFrame(0);
      decodeFrame(0);

      expect(onFrame).toHaveBeenCalledTimes(2);
      expect(onFrame).toHaveBeenCalledWith(canvas);
    });

    it('accepts a callback registered before the camera', () => {
      const canvas = makeCanvas();
      const onFrame = vi.fn<(canvas: HTMLCanvasElement) => void>();
      const { result } = renderVideoStream();
      result.current.video.registerFrameCallback(1, DETECTION, onFrame);

      register(result, 1, canvas, DETECTION);
      decodeFrame(0);

      expect(onFrame).toHaveBeenCalledWith(canvas);
    });

    it('does not call the callback when only the source is established', () => {
      const onFrame = vi.fn<(canvas: HTMLCanvasElement) => void>();
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), DETECTION);
      result.current.video.registerFrameCallback(1, DETECTION, onFrame);

      establishSource(0);

      expect(onFrame).not.toHaveBeenCalled();
    });

    it('stops calling the callback after it is cleared with null', () => {
      const onFrame = vi.fn<(canvas: HTMLCanvasElement) => void>();
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), DETECTION);
      result.current.video.registerFrameCallback(1, DETECTION, onFrame);
      decodeFrame(0);

      result.current.video.registerFrameCallback(1, DETECTION, null);
      decodeFrame(0);

      expect(onFrame).toHaveBeenCalledTimes(1);
    });

    it('only calls the callback for its own camera and view', () => {
      const onDetectionFrame = vi.fn<(canvas: HTMLCanvasElement) => void>();
      const { result } = renderVideoStream();
      register(result, 1, makeCanvas(), DETECTION);
      register(result, 1, makeCanvas(), COPILOT);
      register(result, 2, makeCanvas(), DETECTION);
      result.current.video.registerFrameCallback(1, DETECTION, onDetectionFrame);

      decodeFrame(1);
      decodeFrame(2);

      expect(onDetectionFrame).not.toHaveBeenCalled();

      decodeFrame(0);

      expect(onDetectionFrame).toHaveBeenCalledTimes(1);
    });
  });

  it('destroys every player when it unmounts', () => {
    const { result, unmount } = renderVideoStream();
    register(result, 1, makeCanvas(), COPILOT);
    register(result, 2, makeCanvas(), DETECTION);
    establishSource(0);

    unmount();

    expect(players[0].destroy).toHaveBeenCalledTimes(1);
    expect(players[1].destroy).toHaveBeenCalledTimes(1);
  });
});
