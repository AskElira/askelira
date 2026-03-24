# 🏢 Animated Building Visualization

This document describes the MiroFish-inspired animated building visualization system integrated into AskElira.

## Overview

The system provides a real-time 3D visualization of agent swarm activity across building floors, showing:
- **Animated 3D Building** with multiple floors
- **Real-time Agent Movement** between floors
- **Live Status Updates** via Socket.io
- **Interactive Controls** (rotate, zoom, pan)
- **Agent Activity Tracking** with visual indicators

## Architecture

### Frontend Components

1. **AnimatedBuilding3D.tsx**
   - 3D visualization using React Three Fiber
   - Animated agents with smooth floor transitions
   - Floor status indicators with colors
   - Interactive camera controls
   - Tooltips on hover

2. **Building Page Integration**
   - Toggle between 3D view and list view
   - Real-time data from `useBuildingState` hook
   - Socket.io integration for live updates

### Backend Infrastructure

1. **Custom Server (server.js)**
   - Next.js custom server with Socket.io
   - Real-time event broadcasting
   - Room-based messaging per building/goal
   - Graceful shutdown handling

2. **Socket Event Emitters (lib/socket-emitter.ts)**
   - Type-safe event emission
   - Building-specific events
   - Agent position tracking
   - Floor status updates

3. **Events Definition (lib/events.ts)**
   - Centralized event constants
   - TypeScript types for events

## Running Locally

### With Socket.io (Recommended)

```bash
npm run dev
```

This starts the custom server with Socket.io support on port 3000.

### Without Custom Server (Fallback)

```bash
npm run dev:next
```

Standard Next.js dev server (Socket.io features will be limited).

## Vercel Deployment

**Important:** Vercel serverless functions don't support custom servers with Socket.io.

### Option 1: Polling Fallback (Recommended for Vercel)

The `useBuilding` hook automatically falls back to polling when WebSocket connection fails:

```typescript
// In production, periodically refetch building state
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 5000); // Poll every 5 seconds
  return () => clearInterval(interval);
}, [refetch]);
```

### Option 2: External Socket.io Service

Deploy Socket.io separately:
- Use Railway, Render, or Fly.io for the Socket.io server
- Update `NEXT_PUBLIC_SOCKET_URL` environment variable
- Point Socket.io client to external server

### Option 3: Vercel Edge Functions (Future)

When Vercel supports WebSockets on Edge Functions, update the Socket.io setup.

## Environment Variables

```bash
# App URL (for CORS)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Socket.io URL (optional, defaults to same origin)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Server port
PORT=3000
```

## Usage

### 1. View Building in 3D

Navigate to `/buildings/[goalId]` and click "Show 3D Building" button.

### 2. Simulate Agent Activity (Testing)

```bash
curl -X POST http://localhost:3000/api/building/simulate-activity \
  -H "Content-Type: application/json" \
  -d '{"goalId":"your-goal-id","duration":30}'
```

Or use the GET endpoint:
```bash
curl "http://localhost:3000/api/building/simulate-activity?goalId=your-goal-id"
```

### 3. Emit Events from Your Code

```typescript
import { emitAgentAction, emitFloorStatus } from '@/lib/socket-emitter';

// Emit agent action
emitAgentAction(goalId, {
  agent: 'Alba',
  action: 'researching',
  floorId: 'floor-1',
  iteration: 1,
  reason: 'Searching for patterns',
});

// Emit floor status change
emitFloorStatus(goalId, {
  floorId: 'floor-1',
  status: 'building',
});
```

## Features

### 3D Visualization

- **Dynamic Building Height**: Scales based on number of floors
- **Animated Agents**: Smooth transitions between floors with bobbing animation
- **Floor Colors**: Visual status indicators (green=live, blue=building, yellow=auditing, red=broken)
- **Central Pillar**: Visual anchor for the building structure
- **Grid Floor**: Spatial reference
- **Lighting**: Multiple light sources for depth

### Real-Time Updates

- **Socket.io Events**: Live updates without page refresh
- **Agent Positions**: Track agents moving between floors
- **Floor Status**: See floor progress in real-time
- **Activity Feed**: Recent agent actions displayed

### Interactive Controls

- **Rotate**: Click and drag to rotate the camera
- **Zoom**: Scroll to zoom in/out
- **Pan**: Right-click and drag to pan
- **Hover**: Hover over agents to see details

## Event Flow

```
User Action → API Route → Socket Emitter → Socket.io Server → Client Listener → UI Update
```

Example:
```
Floor Complete → /api/floors/[id] → emitFloorLive() → io.to('building:xxx').emit() → useBuilding hook → AnimatedBuilding3D updates
```

## Customization

### Change Agent Colors

Edit `AGENT_COLORS` in:
- `components/AnimatedBuilding3D.tsx`
- `components/AgentTicker.tsx`
- `lib/socket-emitter.ts`

### Add New Floor Statuses

1. Update `FloorState['status']` type in `hooks/useBuilding.ts`
2. Add color to `FLOOR_COLORS` in `components/AnimatedBuilding3D.tsx`
3. Update `STATUS_STYLES` in building page

### Modify Building Appearance

Edit the `BuildingScene` component in `AnimatedBuilding3D.tsx`:
- Floor height: `floorHeight` constant
- Building width: `boxGeometry` args
- Materials: `meshStandardMaterial` properties
- Lighting: Add/remove lights

## Troubleshooting

### Socket.io Not Connecting

1. Check console for errors
2. Verify server is running with `node server.js`
3. Check CORS settings in `server.js`
4. Ensure firewall allows WebSocket connections

### 3D View Not Rendering

1. Check browser console for Three.js errors
2. Verify WebGL support in browser
3. Disable ad blockers that might block Canvas
4. Try different browser

### Performance Issues

1. Reduce number of visible agents (`maxVisible` prop)
2. Lower polygon count in geometries
3. Disable shadows
4. Reduce animation frame rate

## Production Checklist

- [ ] Test Socket.io fallback to polling
- [ ] Configure CORS for production domain
- [ ] Set up external Socket.io server (if using Vercel)
- [ ] Test on multiple browsers
- [ ] Optimize 3D models for performance
- [ ] Add error boundaries
- [ ] Set up monitoring for Socket.io connections
- [ ] Configure CDN for static assets

## Future Enhancements

- [ ] VR/AR support
- [ ] Agent path history trails
- [ ] Floor interior views
- [ ] Performance metrics overlay
- [ ] Recording and replay of sessions
- [ ] Multi-building city view
- [ ] Collaborative viewing (multiple users)
- [ ] Sound effects and notifications
