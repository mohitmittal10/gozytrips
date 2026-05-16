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
    <Card className="glass-main border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-400" />
          Cloud Backups
        </CardTitle>
        <CardDescription>Securely backup your critical CRM and itinerary data to Google Drive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
          <div>
            <h4 className="font-medium text-sm">Google Drive Connection</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {hasGoogleIntegration ? 'Connected to Google Drive.' : 'Not connected.'}
            </p>
          </div>
          <Button 
            variant={hasGoogleIntegration ? 'outline' : 'default'}
            className="mt-3 sm:mt-0 glass-button"
            onClick={handleConnectDrive}
          >
            {hasGoogleIntegration ? 'Reconnect Account' : 'Connect Google Drive'}
          </Button>
        </div>

        {hasGoogleIntegration && (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium">Automated Backup Frequency</label>
              <div className="flex items-center gap-4">
                <Select value={frequency} onValueChange={handleUpdateFrequency}>
                  <SelectTrigger className="w-[180px] glass-input border-white/10">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Disabled</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground flex-1 mt-1">
                Backups are processed automatically on the server based on your selected frequency.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Manual Backup</p>
                <p className="text-xs text-muted-foreground">
                  Last backup: {userProfile?.last_backup_date ? new Date(userProfile.last_backup_date).toLocaleString() : 'Never'}
                </p>
              </div>
              <Button 
                onClick={handleBackupNow} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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

