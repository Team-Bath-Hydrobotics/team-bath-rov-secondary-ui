# Video Streaming Setup Guide

## Architecture Overview

```
ROV Camera → FFmpeg (MPEG-TS) → UDP → WebSocket Relay → Browser (Canvas)
```

Since browsers cannot directly open UDP/TCP sockets, we use a WebSocket relay server to bridge the gap.

## Setup Steps

### 1. Install Dependencies

#### Python (WebSocket Relay)
```bash
pip install websockets
```

#### Frontend (MPEG-TS Decoder)
```bash
npm install jsmpeg-player
# or
npm install @cycjimmy/jsmpeg-player
```

### 2. Start WebSocket Relay Server

```bash
python websocket_relay.py
```

This starts:
- WebSocket server on `ws://localhost:8081`
- UDP listeners on ports 5000, 5001, 5002 (for cameras 0, 1, 2)

**Configure Camera Ports:**

Edit `websocket_relay.py` to match your camera configuration:

```python
camera_configs = {
    0: 5000,  # Camera 0 receives UDP on port 5000
    1: 5001,  # Camera 1 receives UDP on port 5001
    2: 5002,  # Camera 2 receives UDP on port 5002
}
```

### 3. Configure FFmpeg Backend

Ensure your Python FFmpeg backend sends to the relay's UDP ports:

```python
# In your MPEGTSServer
ffmpeg_cmd = self.get_ffmpeg_encode_cmd() + [
    f"udp://127.0.0.1:{self.port}"  # Send to localhost relay
]
```

Port mapping example:
- Camera 0 → FFmpeg sends to `udp://127.0.0.1:5000`
- Camera 1 → FFmpeg sends to `udp://127.0.0.1:5001`
- Camera 2 → FFmpeg sends to `udp://127.0.0.1:5002`

### 4. Update Frontend Provider (jsmpeg)

#### Option A: Using jsmpeg-player (Recommended)

Install:
```bash
npm install jsmpeg-player
```

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

#### Option B: Using @cycjimmy/jsmpeg-player

Install:
```bash
npm install @cycjimmy/jsmpeg-player
```

Update provider:
```tsx
import JSMpeg from '@cycjimmy/jsmpeg-player';

const player = new JSMpeg.VideoElement(
  canvas,
  wsUrl,
  { autoplay: true }
);
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
```

## Production Deployment

### Docker Compose Setup

```yaml
version: '3.8'
services:
  websocket-relay:
    build: ./relay
    ports:
      - "8081:8081"
      - "5000-5002:5000-5002/udp"
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_WS_URL=ws://relay:8081
```

### Environment Variables

Create `.env`:
```bash
VITE_WS_BASE_URL=ws://localhost:8081
```

Update [`VideoStreamProvider.tsx`](src/providers/VideoStreamProvider.tsx):
```tsx
const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8081';
```

## Troubleshooting

### No Video Appears

1. **Check WebSocket Relay:**
   ```bash
   python websocket_relay.py
   # Should show: "WebSocket relay server running..."
   ```

2. **Verify FFmpeg is sending:**
   ```bash
   # On relay server
   sudo tcpdump -i lo udp port 5000 -v
   # Should see UDP packets
   ```

3. **Check browser console:**
   - Open DevTools → Network → WS
   - Should see `ws://localhost:8081/camera/0` connected
   - Check for binary frames being received

### High Latency

1. **Reduce buffer size** in jsmpeg options:
   ```tsx
   videoBufferSize: 128 * 1024  // Smaller buffer = lower latency
   ```

2. **Use TCP instead of UDP** for reliability:
   ```python
   f"tcp://127.0.0.1:{self.port}"
   ```

### Frame Drops

1. **Check network bandwidth:**
   ```bash
   iftop -i lo  # Monitor localhost traffic
   ```

2. **Adjust FFmpeg encoding:**
   - Lower bitrate: `-b:v 500k`
   - Reduce resolution: `-s 640x480`
   - Lower framerate: `-r 15`

## Alternative Approaches

### MSE (Media Source Extensions)
For native H.264 decoding without external libraries. More complex but better performance.

### WebRTC
Best for ultra-low latency. Requires WebRTC signaling server.

### HLS
Best for production at scale. Higher latency (~3-10s) but extremely reliable.

## Performance Comparison

| Method | Latency | CPU Usage | Browser Support | Complexity |
|--------|---------|-----------|----------------|------------|
| jsmpeg | ~100ms | Medium | All | Low |
| MSE | ~50ms | Low | Modern | High |
| WebRTC | ~20ms | Low | All | Very High |
| HLS | ~3-10s | Low | All | Medium |

For ROV telemetry, **jsmpeg is recommended** for the best balance of latency and simplicity.
