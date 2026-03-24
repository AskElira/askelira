# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.1.x | Yes |
| 2.0.x | Security fixes only |
| < 2.0 | No |

Only the latest minor release receives security patches.

---

## Reporting Vulnerabilities

**Do not open a public issue for security vulnerabilities.**

Email: **security@askelira.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Impact assessment (if known)

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial assessment** within 5 business days
- **Fix or mitigation** within 30 days for confirmed vulnerabilities
- **Public disclosure** after a fix is released, coordinated with the reporter

---

## Disclosure Policy

- We follow coordinated disclosure. Please allow reasonable time for a fix before public disclosure.
- Credit is given to reporters in the release notes (unless anonymity is requested).
- We will not pursue legal action against good-faith security researchers.

---

## Security Best Practices for Users

### API Keys

- Store keys in `~/.askelira/.env`, never in source code
- Use environment variables in CI/CD instead of config files
- Rotate keys periodically
- Use minimum-privilege API keys where possible

### Configuration

- Keep `nodeIntegration: false` in Electron (default)
- Keep `contextIsolation: true` in Electron (default)
- Do not disable sandbox mode in the desktop app
- Review `.env` contents before sharing your AskElira directory

### Network

- The gateway listens on `localhost:5678` by default — do not expose to the public internet without authentication
- The UI server listens on `localhost:3000` — same applies
- Use a reverse proxy (nginx, Caddy) with TLS for remote access
- In Docker, bind to `127.0.0.1` instead of `0.0.0.0` if external access is not needed

### Data

- Debate history in `~/.askelira/memory/` may contain sensitive questions — protect accordingly
- Log files in `~/.askelira/logs/` may contain API responses
- Set `LOG_TO_FILE=false` if logging sensitive debates
- Exclude `~/.askelira/` from cloud sync and backups if contents are sensitive

### Dependencies

- Run `npm audit` periodically to check for known vulnerabilities
- Pin dependency versions in production
- Review dependency changes when updating

---

## Known Security Considerations

- **No authentication on gateway or UI server.** Both services bind to localhost only. Adding network authentication is planned for v2.2 (team workspaces).
- **Brave Search API key transmitted over HTTPS.** The key is sent as a header to the Brave API. It is not logged or stored beyond `~/.askelira/.env`.
- **Electron auto-updater uses HTTPS.** Updates are fetched over encrypted connections via electron-updater.
- **Server-side input validation.** All user input is validated via `lib/content-validator.ts` (XSS, SQL injection, abuse patterns).
- **Rate limiting.** Global middleware (100 req/min) + per-route limits. See `middleware.ts` and `lib/rate-limiter.ts`.
- **HSTS enabled.** Strict-Transport-Security header set via `vercel.json`.
