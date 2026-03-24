# 🚀 Quick Start: 3D Building Visualization

Get your animated building visualization running in 3 steps!

## Step 1: Start the Server

```bash
cd /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm
npm run dev
```

The server will start on `http://localhost:3000` with Socket.io support.

## Step 2: View a Building

1. Open your browser to `http://localhost:3000/buildings`
2. Click on any existing building OR create a new one
3. Click the **"Show 3D Building"** button

You should see an animated 3D visualization of your building with floors!

## Step 3: Simulate Agent Activity (Optional)

Test the real-time features with simulated agent activity:

```bash
# Replace YOUR_GOAL_ID with an actual goal ID from your database
curl "http://localhost:3000/api/building/simulate-activity?goalId=YOUR_GOAL_ID"
```

Or start a longer simulation (30 seconds):

```bash
curl -X POST http://localhost:3000/api/building/simulate-activity \
  -H "Content-Type: application/json" \
  -d '{"goalId":"YOUR_GOAL_ID","duration":30}'
```

Watch agents move between floors in real-time!

## 🎮 Controls

- **Rotate**: Click and drag
- **Zoom**: Scroll wheel
- **Pan**: Right-click and drag
- **Info**: Hover over agents to see details

## 🎨 What You'll See

- **3D Building** with floors stacked vertically
- **Animated Agents** (Alba, David, Vex, Elira, Steven) moving between floors
- **Color-coded Floors**:
  - 🟢 Green = Live
  - 🔵 Blue = Building
  - 🟡 Yellow = Auditing
  - 🔴 Red = Broken
  - ⚫ Gray = Pending
- **Real-time Updates** via WebSocket
- **Progress Indicators** on each floor

## ⚙️ Configuration

### Environment Variables

Create `.env.local` if it doesn't exist:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
```

### Toggle Views

The building page has two views:
1. **List View** (default) - Classic floor cards
2. **3D View** - Animated building visualization

Toggle between them with the button at the top of the page.

## 🔧 Troubleshooting

### Server Won't Start

```bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Clean and restart
rm -rf .next
npm run dev
```

### 3D View Not Showing

1. Check browser console for errors
2. Verify WebGL is enabled in your browser
3. Try a different browser (Chrome/Firefox recommended)
4. Disable browser extensions that might block Canvas

### No Real-time Updates

1. Check Socket.io connection in browser DevTools Network tab
2. Look for WebSocket connection to `/api/socketio`
3. Check server console for Socket.io logs
4. Verify CORS settings allow your domain

## 📊 Features Checklist

- [x] 3D building with multiple floors
- [x] Animated agents with smooth transitions
- [x] Real-time Socket.io updates
- [x] Interactive camera controls
- [x] Color-coded floor status
- [x] Agent tooltips on hover
- [x] Building stats overlay
- [x] Toggle between list and 3D view
- [x] Simulation API for testing
- [x] Documentation and guides

## 🚀 Next Steps

1. **Integrate with Your Agent Logic**
   ```typescript
   import { emitAgentAction } from '@/lib/socket-emitter';

   // When an agent starts work
   emitAgentAction(goalId, {
     agent: 'Alba',
     action: 'researching',
     floorId: floorId,
     iteration: floorNumber,
   });
   ```

2. **Customize Appearance**
   - Edit `components/AnimatedBuilding3D.tsx`
   - Change colors in `AGENT_COLORS` and `FLOOR_COLORS`
   - Adjust floor height, building size, lighting

3. **Deploy to Production**
   - See `BUILDING_VISUALIZATION.md` for deployment options
   - Configure external Socket.io server for Vercel
   - Set up monitoring and analytics

## 📚 Documentation

- Full Documentation: `BUILDING_VISUALIZATION.md`
- Event System: `lib/events.ts`
- Socket Emitters: `lib/socket-emitter.ts`
- Component Code: `components/AnimatedBuilding3D.tsx`

## 💡 Tips

- **Performance**: Reduce `maxVisible` agents if slow
- **Debugging**: Open browser console to see Socket.io events
- **Testing**: Use the simulate-activity API endpoint
- **Customization**: All colors and sizes are configurable

## 🎉 Enjoy Your Animated Building!

Questions? Check the full documentation or contact support.
