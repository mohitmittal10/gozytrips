# Automated Backups Cron

Production backup cron requires `CRON_SECRET` (fail-closed: requests are rejected if unset).

## Setup

1. Set `CRON_SECRET` in production env (App Hosting / Vercel / etc.).
2. Schedule a daily call (prefer header over query string):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/backup/cron
```

Legacy query form still works: `?secret=YOUR_CRON_SECRET` — prefer the header for new schedulers.

Optional: `BACKUP_CRON_CONCURRENCY` (default `5`) controls parallel user backups.
