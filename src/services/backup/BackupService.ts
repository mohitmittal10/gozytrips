import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export class BackupService {
  /**
   * Determines if a backup should be run based on the user's frequency and last backup date.
   */
  static shouldRunBackup(user: { backup_frequency: string; last_backup_date: string | null }): boolean {
    if (user.backup_frequency === 'none') return false;
    if (!user.last_backup_date) return true;

    const now = new Date();
    const lastDate = new Date(user.last_backup_date);
    const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    if (user.backup_frequency === 'weekly' && daysSinceLast >= 7) return true;
    if (user.backup_frequency === 'monthly' && daysSinceLast >= 30) return true;

    return false;
  }

  /**
   * Generates a full JSON backup of the user's data from Supabase.
   */
  static async generateBackupData(customSupabase?: SupabaseClient, customUserId?: string): Promise<Blob> {
    const supabase = customSupabase || createClient();

    let userId = customUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      userId = user.id;
    }

    const [
      clientsRes, tripsRes, itinerariesRes, auditLogsRes, profileRes,
      settingsRes, tripLineItemsRes, tripPaymentsRes, tripExpensesRes, standaloneBookingsRes
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', userId),
      supabase.from('trips').select('*').eq('user_id', userId),
      supabase.from('itineraries').select('*').eq('user_id', userId),
      supabase.from('audit_logs').select('*').eq('user_id', userId),
      supabase.from('user_profiles').select('*').eq('id', userId),
      supabase.from('agency_settings').select('*').eq('user_id', userId),
      supabase.from('trip_line_items').select('*, itineraries!inner(user_id)').eq('itineraries.user_id', userId),
      supabase.from('trip_payments').select('*, itineraries!inner(user_id)').eq('itineraries.user_id', userId),
      supabase.from('trip_expenses').select('*, itineraries!inner(user_id)').eq('itineraries.user_id', userId),
      supabase.from('standalone_bookings').select('*').eq('user_id', userId),
    ]);

    const backupData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      user_id: userId,
      data: {
        clients: clientsRes.data || [],
        trips: tripsRes.data || [],
        itineraries: itinerariesRes.data || [],
        audit_logs: auditLogsRes.data || [],
        user_profiles: profileRes.data || [],
        agency_settings: settingsRes.data || [],
        trip_line_items: tripLineItemsRes.data || [],
        trip_payments: tripPaymentsRes.data || [],
        trip_expenses: tripExpensesRes.data || [],
        standalone_bookings: standaloneBookingsRes.data || [],
      },
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
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive upload failed: ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Orchestrates the full backup process.
   */
  static async performBackup(customSupabase?: SupabaseClient, customUserId?: string): Promise<void> {
    const supabase = customSupabase || createClient();

    let userId = customUserId;
    let googleRefreshToken: string | null = null;

    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      userId = user.id;
    }

    let accessToken: string;

    if (typeof window === 'undefined') {
      // Server-side: Direct refresh via googleapis
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('google_refresh_token')
        .eq('id', userId)
        .single();

      googleRefreshToken = profile?.google_refresh_token;
      if (!googleRefreshToken) throw new Error('Google Drive integration not configured.');

      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      oauth2Client.setCredentials({ refresh_token: googleRefreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();
      accessToken = credentials.access_token!;
    } else {
      // Client-side: Call API route
      const tokenRes = await fetch('/api/google/token');
      if (!tokenRes.ok) {
        if (tokenRes.status === 404) throw new Error('Google Drive integration not configured.');
        throw new Error('Failed to obtain Google Drive access token.');
      }
      const { access_token } = await tokenRes.json();
      accessToken = access_token;
    }

    if (!accessToken) throw new Error('No access token returned.');

    const fileBlob = await this.generateBackupData(supabase, userId);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `WanderLabs_Backup_${dateStr}.json`;

    await this.uploadToGoogleDrive(accessToken, fileBlob, filename);

    await supabase
      .from('user_profiles')
      .update({ last_backup_date: new Date().toISOString() })
      .eq('id', userId);
  }

  /**
   * Lists backup files stored in Google Drive.
   */
  static async listBackups(accessToken: string): Promise<any[]> {
    const query = encodeURIComponent("name contains 'WanderLabs_Backup_' and trashed = false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) throw new Error('Failed to list backup files from Google Drive.');
    const data = await response.json();
    return data.files || [];
  }

  /**
   * Downloads a specific backup file from Google Drive.
   */
  static async downloadBackup(accessToken: string, fileId: string): Promise<any> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to download backup file from Google Drive.');
    return await response.json();
  }

  /**
   * Restores data to Supabase from a backup payload.
   */
  static async restoreBackup(backupData: any): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const dataToRestore = backupData.data;
    if (!dataToRestore) throw new Error('Invalid backup format');

    const idMap = new Map<string, string>();
    const isSameUser = backupData.user_id === user.id;

    const generateRandomId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const getTargetId = (originalId: string) => {
      if (!originalId) return generateRandomId();
      if (isSameUser) return originalId;
      if (!idMap.has(originalId)) idMap.set(originalId, generateRandomId());
      return idMap.get(originalId)!;
    };

    const resolveForeignKey = (foreignKey: any) => {
      if (!foreignKey) return null;
      if (isSameUser) return foreignKey;
      return idMap.get(foreignKey) || foreignKey;
    };

    const mappedClients = (dataToRestore.clients || []).map((c: any) => ({
      ...c, id: getTargetId(c.id), user_id: user.id,
    }));

    const mappedTrips = (dataToRestore.trips || []).map((t: any) => {
      const mapped = { ...t, id: getTargetId(t.id), user_id: user.id };
      if ('client_id' in t) mapped.client_id = resolveForeignKey(t.client_id);
      return mapped;
    });

    const mappedItineraries = (dataToRestore.itineraries || []).map((i: any) => {
      const mapped = { ...i, id: getTargetId(i.id), user_id: user.id };
      if ('client_id' in i) mapped.client_id = resolveForeignKey(i.client_id);
      if ('trip_id' in i) mapped.trip_id = resolveForeignKey(i.trip_id);
      return mapped;
    });

    const mappedAuditLogs = (dataToRestore.audit_logs || []).map((a: any) => {
      const mapped = { ...a, id: getTargetId(a.id), user_id: user.id };
      if ('entity_id' in a) mapped.entity_id = resolveForeignKey(a.entity_id);
      return mapped;
    });

    const mappedTripLineItems = (dataToRestore.trip_line_items || []).map((tl: any) => {
      const { itineraries, ...rest } = tl;
      return { ...rest, id: getTargetId(rest.id), itinerary_id: resolveForeignKey(rest.itinerary_id) };
    });

    const mappedTripPayments = (dataToRestore.trip_payments || []).map((tp: any) => {
      const { itineraries, ...rest } = tp;
      return { ...rest, id: getTargetId(rest.id), itinerary_id: resolveForeignKey(rest.itinerary_id) };
    });

    const mappedTripExpenses = (dataToRestore.trip_expenses || []).map((te: any) => {
      const { itineraries, ...rest } = te;
      return { ...rest, id: getTargetId(rest.id), itinerary_id: resolveForeignKey(rest.itinerary_id) };
    });

    const mappedStandaloneBookings = (dataToRestore.standalone_bookings || []).map((sb: any) => {
      const mapped = { ...sb, id: getTargetId(sb.id), user_id: user.id };
      if ('client_id' in sb) mapped.client_id = resolveForeignKey(sb.client_id);
      return mapped;
    });

    const upsertInChunks = async (tableName: string, records: any[]) => {
      if (!records || records.length === 0) return;
      const chunkSize = 500;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase.from(tableName as any).upsert(chunk, { onConflict: 'id' });
        if (error) throw new Error(`Failed to restore ${tableName}: ${error.message}`);
      }
    };

    try {
      await upsertInChunks('clients', mappedClients);
      await upsertInChunks('trips', mappedTrips);
      await upsertInChunks('itineraries', mappedItineraries);
      await upsertInChunks('trip_line_items', mappedTripLineItems);
      await upsertInChunks('trip_payments', mappedTripPayments);
      await upsertInChunks('trip_expenses', mappedTripExpenses);
      await upsertInChunks('audit_logs', mappedAuditLogs);
      await upsertInChunks('standalone_bookings', mappedStandaloneBookings);

      if (dataToRestore.user_profiles?.length > 0) {
        const { id, ...profileRest } = dataToRestore.user_profiles[0];
        const { error } = await supabase.from('user_profiles').upsert({ ...profileRest, id: user.id }, { onConflict: 'id' });
        if (error) throw new Error(`Failed to restore user profile: ${error.message}`);
      }

      if (dataToRestore.agency_settings?.length > 0) {
        const { id, agent_signature, ...settingsRest } = dataToRestore.agency_settings[0];
        const { error } = await supabase.from('agency_settings').upsert({ ...settingsRest, user_id: user.id }, { onConflict: 'user_id' });
        if (error) throw new Error(`Failed to restore agency settings: ${error.message}`);
      }
    } catch (err: any) {
      throw new Error(`Restore failed during database insertion: ${err.message}`);
    }
  }
}

