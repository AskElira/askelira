# Production Readiness Checklist

Use this checklist before deploying AskElira to production.

## Environment

- [ ] `NODE_ENV=production` is set
- [ ] All required env vars present (`npm run db:validate` passes)
- [ ] `NEXTAUTH_SECRET` is a random 32+ character string
- [ ] `CRON_SECRET` is set and unique
- [ ] `POSTGRES_URL` points to production database
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] API keys are production keys (not test/dev)

## Database

- [ ] Migrations applied (`npm run db:migrate`)
- [ ] Schema validation passes (`npm run db:validate`)
- [ ] Automated backups enabled (Vercel Postgres dashboard)
- [ ] Connection pooling configured (default: max 10)

## Security

- [ ] Secrets scan clean (`npm run security:scan`)
- [ ] Dependency audit clean (`npm run security:audit`)
- [ ] HTTPS enforced (Vercel handles this)
- [ ] HSTS header enabled (vercel.json)
- [ ] CORS restricted to production origin
- [ ] API rate limiting active (middleware.ts: 100 req/min)
- [ ] Content validation enabled (lib/content-validator.ts)
- [ ] Stripe webhook signature verification enabled

## Monitoring

- [ ] Health endpoint responds (`GET /api/health`)
- [ ] Database health check included in health endpoint
- [ ] Telegram notifications configured
- [ ] Steven heartbeat active for live goals
- [ ] Error logging to console (Vercel captures)

## Performance

- [ ] Build completes without errors (`npm run build`)
- [ ] Vercel function timeouts configured (vercel.json)
- [ ] Database indexes applied (migration 011)
- [ ] Build queue limits set (3 concurrent, 20 daily)

## Billing

- [ ] Stripe keys are live (not test)
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Subscription grace period configured
- [ ] Billing status checked in heartbeat cycle
