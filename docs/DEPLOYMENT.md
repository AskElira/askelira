# Deployment Guide

## Vercel (Recommended for Web App)

### Quick Deploy

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Environment Setup

1. Vercel Dashboard → Settings → Environment Variables
2. Add all required keys:
   - `ANTHROPIC_API_KEY` - Anthropic API key
   - `BRAVE_API_KEY` - Brave Search API key
   - `GOOGLE_CLIENT_ID` - Google OAuth
   - `GOOGLE_CLIENT_SECRET` - Google OAuth
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your deployment URL (e.g. https://askelira.com)
   - `POSTGRES_URL` - Vercel Postgres connection string
3. Redeploy

### Database Setup

1. Vercel Dashboard → Storage → Create Database (Postgres)
2. Copy connection string to `POSTGRES_URL`
3. Run schema: `psql $POSTGRES_URL < lib/schema.sql`

### Custom Domain

1. Vercel Dashboard → Domains
2. Add www.askelira.com
3. Configure DNS (Vercel provides instructions)

### Post-Deployment Checklist

- Test all pages
- Verify OAuth works (check callback URLs in Google Console)
- Check rate limits
- Monitor costs in Vercel dashboard

---

## npm Publish Workflow

### Prerequisites

- npm account with publish access
- Logged in: `npm login`
- Clean working directory: `git status`

### Publish Steps

```bash
# 1. Run all tests
npm test

# 2. Bump version
npm version patch   # or minor / major

# 3. Build Electron app (optional)
npm run electron:build

# 4. Publish to npm
npm publish

# 5. Push tags
git push --tags
```

### Scoped Publishing

If publishing under a scope:

```bash
npm publish --access public
```

### Pre-publish Checklist

- [ ] All tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] README.md is current
- [ ] No `.env` or secrets in the package (check `.npmignore`)

---

## Electron Build

### macOS

```bash
npm run electron:build
```

Outputs:
- `dist/AskElira-2.0.0.dmg` — Disk image installer
- `dist/AskElira-2.0.0-mac.zip` — Zip archive

Requires:
- Xcode command line tools
- For signing: Apple Developer certificate and `CSC_LINK` / `CSC_KEY_PASSWORD` env vars
- For notarization: `APPLE_ID` and `APPLE_APP_SPECIFIC_PASSWORD` env vars

### Windows

```bash
npm run electron:build -- --win
```

Outputs:
- `dist/AskElira-Setup-2.0.0.exe` — NSIS installer

Requires:
- Windows or CI with Wine (for cross-compilation)
- For signing: Code signing certificate (`CSC_LINK`, `CSC_KEY_PASSWORD`)

### Linux

```bash
npm run electron:build -- --linux
```

Outputs:
- `dist/AskElira-2.0.0.AppImage` — Portable executable
- `dist/AskElira-2.0.0.deb` — Debian package (if configured)

Add to `build` in `package.json`:

```json
"linux": {
  "target": ["AppImage", "deb"],
  "category": "Development"
}
```

### All Platforms (CI)

Use GitHub Actions to build for all platforms:

```yaml
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run electron:build
      - uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.os }}
          path: dist/
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY bin/ bin/
COPY src/ src/
COPY config/ config/
COPY templates/ templates/
COPY public/ public/

EXPOSE 3000 5678

CMD ["node", "bin/cli.js", "start"]
```

### Build and Run

```bash
docker build -t askelira .
docker run -p 3000:3000 -p 5678:5678 \
  -e BRAVE_API_KEY=your-key \
  -v ~/.askelira:/root/.askelira \
  askelira
```

### Docker Compose

```yaml
version: '3.8'
services:
  askelira:
    build: .
    ports:
      - "3000:3000"
      - "5678:5678"
    environment:
      - BRAVE_API_KEY=${BRAVE_API_KEY}
      - LOG_LEVEL=info
      - LOG_TO_FILE=true
    volumes:
      - askelira-data:/root/.askelira

volumes:
  askelira-data:
```

---

## Environment Setup

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BRAVE_API_KEY` | Brave Search API key for Alba research | Optional |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging verbosity: debug, info, warn, error | `info` |
| `LOG_TO_FILE` | Write logs to `~/.askelira/logs/` | `true` |
| `NODE_ENV` | Set to `production` for production mode | — |
| `AUTO_UPDATE` | Enable/disable Electron auto-updates | `true` |

### Configuration File

Settings are stored in `~/.askelira/.env`. Manage with the CLI:

```bash
askelira config --list
askelira config --set BRAVE_API_KEY=your-key
askelira config --get BRAVE_API_KEY
```

---

## Production Considerations

### Security

- Never commit `.env` files or API keys
- Use environment variables for secrets in CI/CD
- The Electron app uses `contextBridge` for secure IPC — never disable `contextIsolation`
- `nodeIntegration` is disabled in the renderer process
- External URLs are validated (http/https only) before opening

### Performance

- Default agent count (10,000) is a good balance of accuracy and speed
- Higher agent counts (50K+) increase latency linearly
- Memory files grow over time — consider periodic cleanup of `~/.askelira/memory/`
- ChromaDB vector store may need optimization for >100K stored debates

### Monitoring

- Logs are written to `~/.askelira/logs/YYYY-MM-DD.log`
- Each debate result includes `duration` and `actualCost` for tracking
- Use `--verbose` flag for debug-level output

### Graceful Shutdown

The gateway handles `SIGINT` and `SIGTERM` for clean shutdown. In Docker, ensure the process receives signals:

```dockerfile
# Use exec form so node gets signals directly
CMD ["node", "bin/cli.js", "start"]
```

---

## Scaling Strategies

### Horizontal: Multiple Gateway Instances

Run multiple gateway instances behind a load balancer for high throughput:

```bash
# Instance 1
PORT=5678 node bin/cli.js start --no-ui

# Instance 2
PORT=5679 node bin/cli.js start --no-ui
```

### Vertical: Agent Count Tuning

| Use Case | Agents | Approx. Cost | Approx. Time |
|----------|--------|-------------|--------------|
| Quick check | 1,000 | $0.007 | ~2s |
| Standard debate | 10,000 | $0.07 | ~5s |
| High confidence | 50,000 | $0.35 | ~15s |
| Maximum accuracy | 100,000 | $0.70 | ~30s |

### Memory: External Vector DB

For production, consider running ChromaDB as a standalone service:

```bash
docker run -p 8000:8000 chromadb/chroma
```

Then point AskElira to the external instance by configuring the ChromaDB client URL.

### Caching

Frequently asked questions can be cached by checking memory before running a new debate:

```javascript
const cached = await searchMemory(question, 1);
if (cached.length && cached[0].distance < 0.1) {
  return cached[0].metadata; // Use previous result
}
```
