# Rate Limits

## Tiers
- **Free**: 1 debate/week (4/month)
- **Pro ($20/mo)**: 20 debates/month + $0.80 per additional
- **Enterprise ($200/mo)**: Unlimited debates

## Implementation
- Middleware checks usage before /api/swarm
- Returns 429 Too Many Requests if over limit
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining
- Usage tracked in Vercel Postgres

## Enterprise Override
Email `alvin.kerremans@gmail.com` is hardcoded as Enterprise (unlimited).
