# Video Streaming Setup Guide

## Architecture Overview

```
ROV Camera → FFmpeg (MPEG-TS) → UDP → WebSocket Relay → Browser (Canvas)
```
Since browsers cannot directly open UDP/TCP sockets, we use a WebSocket relay server to bridge the gap.
MediaSource Extensions (MSE)
## Setup Steps


This starts:
- WebSocket server on `ws://localhost:8081`
- UDP listeners on ports 5000, 5001, 5002 (for cameras 0, 1, 2)






Update [`VideoStreamProvider.tsx`](src/providers/VideoStreamProvider.tsx):

```tsx
import JSMpeg from 'jsmpeg-player';

// In registerCamera callback:
const player = new JSMpeg.Player(wsUrl, {
  canvas: canvas,
  autoplay: true,
  audio: false,
  videoBufferSize: 512 * 1024,
  preserveDrawingBuffer: true,
});

players.current.set(cameraId, player);
```


### 5. Wrap App with VideoStreamProvider

In your main app file ([`main.tsx`](src/app/main.tsx)):

```tsx
import { VideoStreamProvider } from './providers/VideoStreamProvider';

root.render(
  <VideoStreamProvider wsBaseUrl="ws://localhost:8081">
    <App />
  </VideoStreamProvider>
);
``