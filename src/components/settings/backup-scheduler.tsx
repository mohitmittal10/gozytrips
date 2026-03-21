'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { BackupService } from '@/lib/backup-service';

export default function BackupScheduler() {
  const { userProfile } = useAuth();
  const attemptMade = useRef(false);

  useEffect(() => {
    const checkAndRunBackup = async () => {
      // Only run once per session/mount to avoid spamming
      if (attemptMade.current || !userProfile) return;
      
      const { backup_frequency, last_backup_date, google_refresh_token } = userProfile;

      // Ensure requirements are met
      if (!google_refresh_token || !backup_frequency || backup_frequency === 'none') return;

      let shouldBackup = false;
      const now = new Date();

      if (!last_backup_date) {
        shouldBackup = true;
      } else {
        const lastDate = new Date(last_backup_date);
        const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

        if (backup_frequency === 'weekly' && daysSinceLast >= 7) {
          shouldBackup = true;
        } else if (backup_frequency === 'monthly' && daysSinceLast >= 30) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        attemptMade.current = true;
        try {
          console.log('[BackupScheduler] Automated backup triggered.');
          await BackupService.performBackup();
          console.log('[BackupScheduler] Automated backup successful.');
        } catch (error) {
          console.error('[BackupScheduler] Automated backup failed:', error);
        }
      }
    };

    checkAndRunBackup();
  }, [userProfile]);

  return null; // Invisible scheduler component
}
