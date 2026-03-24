/**
 * Custom Next.js server with Socket.io support
 *
 * This server enables real-time communication for the building visualization
 * and integrates Socket.io with Next.js App Router.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { BUILDING_EVENTS } = require('./lib/events');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.io connection handling
  // Track connections per IP to prevent resource exhaustion
  const connectionsPerIp = new Map();
  const MAX_CONNECTIONS_PER_IP = 20;

  // UUID v4 pattern for validating goalId / room names
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  io.on('connection', (socket) => {
    // Track per-IP connections
    const clientIp =
      (socket.handshake.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      socket.handshake.address ||
      'unknown';
    const currentCount = connectionsPerIp.get(clientIp) || 0;

    if (currentCount >= MAX_CONNECTIONS_PER_IP) {
      console.warn(`[Socket.io] Too many connections from ${clientIp} (${currentCount}), rejecting`);
      socket.disconnect(true);
      return;
    }
    connectionsPerIp.set(clientIp, currentCount + 1);

    const goalId = socket.handshake.query.goalId;
    console.log(`[Socket.io] Client connected: ${socket.id}`, goalId ? `for goal: ${goalId}` : '');

    if (goalId) {
      // Join room for this specific building/goal
      const roomName = `building:${goalId}`;
      socket.join(roomName);
      console.log(`[Socket.io] Client ${socket.id} joined room: ${roomName}`);

      // Send connection confirmation
      socket.emit('connected', {
        goalId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle subscribe to specific rooms (validated)
    socket.on('subscribe', (room) => {
      // Only allow building: prefixed rooms with valid UUID goalIds
      if (typeof room !== 'string' || !room.startsWith('building:')) {
        socket.emit('error', { message: 'Invalid room format. Must be building:<goalId>' });
        return;
      }
      const roomGoalId = room.slice('building:'.length);
      if (!UUID_RE.test(roomGoalId)) {
        socket.emit('error', { message: 'Invalid goalId format in room name' });
        return;
      }
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} subscribed to room: ${room}`);
      socket.emit('subscribed', { room });
    });

    // Handle unsubscribe from rooms
    socket.on('unsubscribe', (room) => {
      if (typeof room !== 'string') return;
      socket.leave(room);
      console.log(`[Socket.io] Client ${socket.id} unsubscribed from room: ${room}`);
      socket.emit('unsubscribed', { room });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);
      // Decrement per-IP connection count
      const count = connectionsPerIp.get(clientIp) || 1;
      if (count <= 1) {
        connectionsPerIp.delete(clientIp);
      } else {
        connectionsPerIp.set(clientIp, count - 1);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket.io] Socket error for ${socket.id}:`, error);
    });
  });

  // Make io instance available globally for other parts of the app
  global.io = io;

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('[Server] Shutting down gracefully...');
    io.close(() => {
      console.log('[Socket.io] Closed');
      httpServer.close(() => {
        console.log('[HTTP Server] Closed');
        process.exit(0);
      });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('[Server] Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Start server
  httpServer
    .once('error', (err) => {
      console.error('[Server] Fatal error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🏢 AskElira Building Visualization Server               ║
║                                                           ║
║  ✓ Next.js: http://${hostname}:${port}${' '.repeat(Math.max(0, 30 - hostname.length - port.toString().length))}║
║  ✓ Socket.io: /api/socketio                               ║
║  ✓ Environment: ${dev ? 'development' : 'production'}${' '.repeat(Math.max(0, 37 - (dev ? 'development' : 'production').length))}║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
});

/**
 * Helper function to emit events to a specific building room
 * Can be called from API routes via global.io
 */
function emitToBuildingRoom(goalId, event, data) {
  if (global.io) {
    global.io.to(`building:${goalId}`).emit(event, data);
    console.log(`[Socket.io] Emitted ${event} to building:${goalId}`);
  } else {
    console.warn('[Socket.io] IO instance not available');
  }
}

/**
 * Helper function to broadcast to all clients
 */
function broadcast(event, data) {
  if (global.io) {
    global.io.emit(event, data);
    console.log(`[Socket.io] Broadcasted ${event} to all clients`);
  } else {
    console.warn('[Socket.io] IO instance not available');
  }
}

// Export helpers for use in API routes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    emitToBuildingRoom,
    broadcast,
  };
}
