'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BackupService } from '@/lib/backup-service';
import { createClient } from '@/lib/supabase/client';
import { Cloud, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UniqueLoading from '../ui/morph-loading';

export default function BackupSettings({ userId, userProfile }: { userId: string; userProfile: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [frequency, setFrequency] = useState(userProfile?.backup_frequency || 'none');
  const [hasGoogleIntegration, setHasGoogleIntegration] = useState(!!userProfile?.google_refresh_token);
  const supabase = createClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_connected') === 'true') {
      setHasGoogleIntegration(true);
      toast({ title: 'Success', description: 'Google Drive connected successfully!' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleConnectDrive = () => {
    window.location.href = '/api/google/auth';
  };

  const handleBackupNow = async () => {
    if (!hasGoogleIntegration) {
      toast({ title: 'Integration missing', description: 'Please connect Google Drive first.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      await BackupService.performBackup();
      toast({ title: 'Success', description: 'Backup completed successfully.' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Backup failed', description: error.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFrequency = async (value: string) => {
    setFrequency(value);
    const { error } = await supabase
      .from('user_profiles')
      .update({ backup_frequency: value })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update backup frequency', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Backup frequency set to ${value}` });
    }
  };

  return (
    <Card className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none text-slate-900 dark:text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Cloud className="w-5 h-5 text-primary" />
          Cloud Backups
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-gray-400">Securely backup your critical CRM and itinerary data to Google Drive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
          <div>
            <h4 className="font-medium text-sm text-slate-900 dark:text-white">Google Drive Connection</h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {hasGoogleIntegration ? 'Connected to Google Drive.' : 'Not connected.'}
            </p>
          </div>
          <Button 
            variant={hasGoogleIntegration ? 'outline' : 'default'}
            className="mt-3 sm:mt-0 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            onClick={handleConnectDrive}
          >
            {hasGoogleIntegration ? 'Reconnect Account' : 'Connect Google Drive'}
          </Button>
        </div>

        {hasGoogleIntegration && (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-900 dark:text-white">Automated Backup Frequency</label>
              <div className="flex items-center gap-4">
                <Select value={frequency} onValueChange={handleUpdateFrequency}>
                  <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-black/20 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl">
                    <SelectItem value="none">Disabled</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 flex-1 mt-1">
                Backups are processed automatically on the server based on your selected frequency.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Manual Backup</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Last backup: {userProfile?.last_backup_date ? new Date(userProfile.last_backup_date).toLocaleString() : 'Never'}
                </p>
              </div>
              <Button 
                onClick={handleBackupNow} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 cursor-pointer"
              >
                {loading ? <UniqueLoading variant="morph" size="sm" className="w-5 h-5 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Backup Now
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

