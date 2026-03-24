const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const { Swarm } = require('../agents/swarm');
const { searchMemory, getRecentDebates, saveToMemory } = require('../memory');
const { Gateway } = require('../gateway');

const PORT = process.env.UI_PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function start() {
  const server = http.createServer(handleRequest);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  });

  function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(message);
    });
  }

  server.listen(PORT, () => {
    console.log(`AskElira UI running at http://localhost:${PORT}`);
  });

  return { server, wss, broadcast };
}

async function handleRequest(req, res) {
  // API routes
  if (req.url.startsWith('/api/')) {
    return handleAPI(req, res);
  }

  // Static files
  serveStatic(req, res);
}

async function handleAPI(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    // POST /api/swarm
    if (req.method === 'POST' && req.url === '/api/swarm') {
      const body = await readBody(req);
      const { question, agents = 10000 } = JSON.parse(body);

      if (!question) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'question is required' }));
        return;
      }

      const swarm = new Swarm({ agents: parseInt(agents) });
      const result = await swarm.debate(question);
      await saveToMemory(result);

      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // GET /api/history
    if (req.method === 'GET' && req.url.startsWith('/api/history')) {
      const params = new URL(req.url, `http://localhost:${PORT}`).searchParams;
      const query = params.get('query');
      const days = parseInt(params.get('days') || '7');

      let results;
      if (query) {
        results = await searchMemory(query, 10);
      } else {
        results = getRecentDebates(days);
      }

      res.writeHead(200);
      res.end(JSON.stringify(results));
      return;
    }

    // GET /api/status
    if (req.method === 'GET' && req.url === '/api/status') {
      const gateway = new Gateway();
      const running = await gateway.isRunning();

      res.writeHead(200);
      res.end(JSON.stringify({
        gateway: running ? 'online' : 'offline',
        ui: 'online',
        port: PORT,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // 404 for unknown API routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, filePath);

  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

module.exports = { start };
