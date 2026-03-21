import { createClient } from '@/lib/supabase/client';

export class BackupService {
  /**
   * Generates a full JSON backup of the user's data from Supabase.
   */
  static async generateBackupData(): Promise<Blob> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch all related data
    const [clientsRes, tripsRes, itinerariesRes, auditLogsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('trips').select('*').eq('user_id', user.id),
      supabase.from('itineraries').select('*').eq('user_id', user.id),
      supabase.from('audit_logs').select('*').eq('user_id', user.id)
    ]);

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user_id: user.id,
      data: {
        clients: clientsRes.data || [],
        trips: tripsRes.data || [],
        itineraries: itinerariesRes.data || [],
        audit_logs: auditLogsRes.data || []
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Uploads a Blob to Google Drive using the provided access token.
   */
  static async uploadToGoogleDrive(accessToken: string, fileBlob: Blob, filename: string): Promise<string> {
    const metadata = {
      name: filename,
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive upload failed: ${errorText}`);
    }

    const result = await response.json();
    return result.id; // Returns the Drive File ID
  }

  /**
   * Orchestrates the full backup process.
   */
  static async performBackup(): Promise<void> {
    // 1. Get fresh access token
    const tokenRes = await fetch('/api/google/token');
    if (!tokenRes.ok) {
      if (tokenRes.status === 404) {
        throw new Error('Google Drive integration not configured.');
      }
      throw new Error('Failed to obtain Google Drive access token.');
    }
    
    const { access_token } = await tokenRes.json();
    if (!access_token) throw new Error('No access token returned.');

    // 2. Generate backup file
    const fileBlob = await this.generateBackupData();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `GozyTrips_Backup_${dateStr}.json`;

    // 3. Upload to Google Drive
    await this.uploadToGoogleDrive(access_token, fileBlob, filename);

    // 4. Update last_backup_date in profile
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ last_backup_date: new Date().toISOString() })
        .eq('id', user.id);
    }
  }
}
