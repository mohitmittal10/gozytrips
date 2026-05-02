# TODO: Enable Automated Backups in Production

To fully enable the automated backup system, follow these steps:

1. **Set Environment Variable**: Add `CRON_SECRET` to your production environment variables (e.g., in Vercel, Netlify, or your server).
2. **Configure Cron Service**: Use a service like Vercel Cron, GitHub Actions, or a standard crontab to call the following endpoint periodically (e.g., once a day):

   ```
   GET https://your-domain.com/api/backup/cron?secret=YOUR_CRON_SECRET
   ```

Replace `your-domain.com` with your actual production URL and `YOUR_CRON_SECRET` with the value you set in step 1.
