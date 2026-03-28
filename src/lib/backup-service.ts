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
    const [clientsRes, tripsRes, itinerariesRes, auditLogsRes, profileRes, settingsRes, tripLineItemsRes, standaloneBookingsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('trips').select('*').eq('user_id', user.id),
      supabase.from('itineraries').select('*').eq('user_id', user.id),
      supabase.from('audit_logs').select('*').eq('user_id', user.id),
      supabase.from('user_profiles').select('*').eq('id', user.id),
      supabase.from('agency_settings').select('*').eq('user_id', user.id),
      supabase.from('trip_line_items').select('*, itineraries!inner(user_id)').eq('itineraries.user_id', user.id),
      supabase.from('standalone_bookings').select('*').eq('user_id', user.id)
    ]);

    // Clean up the joined data from trip_line_items if needed, or just let it be.
    // Actually, the simplest way is to get all itineraries first and then their items.
    // But since we are in Promise.all, I'll stick to a valid query.
    // Note: Suapbase supports !inner for filtering on joined tables.

    const backupData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      user_id: user.id,
      data: {
        clients: clientsRes.data || [],
        trips: tripsRes.data || [],
        itineraries: itinerariesRes.data || [],
        audit_logs: auditLogsRes.data || [],
        user_profiles: profileRes.data || [],
        agency_settings: settingsRes.data || [],
        trip_line_items: tripLineItemsRes.data || [],
        standalone_bookings: standaloneBookingsRes.data || []
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

  /**
   * Lists backup files stored in Google Drive
   */
  static async listBackups(accessToken: string): Promise<any[]> {
    const query = encodeURIComponent("name contains 'GozyTrips_Backup_' and trashed = false");
    // We only need id, name, createdTime
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
        throw new Error('Failed to list backup files from Google Drive.');
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Downloads a specific backup file from Google Drive
   */
  static async downloadBackup(accessToken: string, fileId: string): Promise<any> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
        throw new Error('Failed to download backup file from Google Drive.');
    }

    return await response.json();
  }

  /**
   * Restores data to Supabase
   */
  static async restoreBackup(backupData: any): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const dataToRestore = backupData.data;
    if (!dataToRestore) throw new Error('Invalid backup format');
    
    // We use a Map to track old ID -> new ID to maintain foreign key relationships
    const idMap = new Map<string, string>();
    
    // Check if the user importing is the original owner of the backup
    const isSameUser = backupData.user_id === user.id;

    // Helper to generate UUID fallback if crypto.randomUUID is somehow missing
    const generateRandomId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Deterministically get the ID for an entity
    const getTargetId = (originalId: string) => {
      if (!originalId) return generateRandomId();
      // If the user restoring their own backup, safely reuse the exact IDs to prevent duplicating data
      if (isSameUser) return originalId;
      
      // If it's a cross-account clone, randomly generate and track new IDs
      if (!idMap.has(originalId)) {
        idMap.set(originalId, generateRandomId());
      }
      return idMap.get(originalId)!;
    };

    const resolveForeignKey = (foreignKey: any) => {
        if (!foreignKey) return null;
        if (isSameUser) return foreignKey; 
        return idMap.get(foreignKey) || foreignKey;
    };

    // 1. Process and map clients
    const mappedClients = (dataToRestore.clients || []).map((c: any) => {
      const newId = getTargetId(c.id);
      return { ...c, id: newId, user_id: user.id };
    });

    // 2. Process and map trips (if they exist)
    const mappedTrips = (dataToRestore.trips || []).map((t: any) => {
      const newId = getTargetId(t.id);
      const mapped = { ...t, id: newId, user_id: user.id };
      if ('client_id' in t) mapped.client_id = resolveForeignKey(t.client_id);
      return mapped;
    });

    // 3. Process and map itineraries
    const mappedItineraries = (dataToRestore.itineraries || []).map((i: any) => {
      const newId = getTargetId(i.id);
      const mapped = { ...i, id: newId, user_id: user.id };
      if ('client_id' in i) mapped.client_id = resolveForeignKey(i.client_id);
      if ('trip_id' in i) mapped.trip_id = resolveForeignKey(i.trip_id);
      return mapped;
    });

    // 4. Process and map audit logs
    const mappedAuditLogs = (dataToRestore.audit_logs || []).map((a: any) => {
      const newId = getTargetId(a.id);
      const mapped = { ...a, id: newId, user_id: user.id };
      if ('entity_id' in a) mapped.entity_id = resolveForeignKey(a.entity_id);
      return mapped;
    });

    // 5. Process trip_line_items (Finances)
    const mappedTripLineItems = (dataToRestore.trip_line_items || []).map((tl: any) => {
      return {
        id: getTargetId(tl.id),
        itinerary_id: resolveForeignKey(tl.itinerary_id),
        title: tl.title,
        category: tl.category,
        net_cost: tl.net_cost,
        markup_percentage: tl.markup_percentage,
        currency: tl.currency,
        created_at: tl.created_at,
        updated_at: tl.updated_at
      };
    });

    // 6. Process standalone_bookings
    const mappedStandaloneBookings = (dataToRestore.standalone_bookings || []).map((sb: any) => {
      const newId = getTargetId(sb.id);
      const mapped = { ...sb, id: newId, user_id: user.id };
      if ('client_id' in sb) mapped.client_id = resolveForeignKey(sb.client_id);
      return mapped;
    });

    // Helper to chunk array and safely upsert data across runs
    const upsertInChunks = async (tableName: string, records: any[]) => {
        if (!records || records.length === 0) return;
        
        const chunkSize = 500;
        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            const { error } = await supabase
                .from(tableName as any)
                .upsert(chunk, { onConflict: 'id' });
            
            if (error) {
                console.error(`Error restoring ${tableName}:`, error);
                throw new Error(`Failed to restore ${tableName}: ${error.message}`);
            }
        }
    };
    
    try {
        // Core relational data
        await upsertInChunks('clients', mappedClients);
        await upsertInChunks('trips', mappedTrips);
        await upsertInChunks('itineraries', mappedItineraries);
        await upsertInChunks('trip_line_items', mappedTripLineItems);
        await upsertInChunks('audit_logs', mappedAuditLogs);
        await upsertInChunks('standalone_bookings', mappedStandaloneBookings);

        // Core single-row settings data that matches exactly with user UUID
        if (dataToRestore.user_profiles && dataToRestore.user_profiles.length > 0) {
            // user_profiles uses 'id' as the user's UUID primary key
            const { id, ...profileRest } = dataToRestore.user_profiles[0];
            const profile = { ...profileRest, id: user.id };
            const { error } = await supabase.from('user_profiles').upsert(profile, { onConflict: 'id' });
            if (error) throw new Error(`Failed to restore user profile: ${error.message}`);
        }

        if (dataToRestore.agency_settings && dataToRestore.agency_settings.length > 0) {
            // agency_settings has a random uuid 'id' but a UNIQUE 'user_id'. 
            // We strip out the old 'id' completely so Supabase only uses 'user_id' for ON CONFLICT DO UPDATE
            const { id, agent_signature, ...settingsRest } = dataToRestore.agency_settings[0];
            const settings = { ...settingsRest, user_id: user.id };
            const { error } = await supabase.from('agency_settings').upsert(settings, { onConflict: 'user_id' });
            if (error) throw new Error(`Failed to restore agency settings: ${error.message}`);
        }

    } catch (err: any) {
         throw new Error(`Restore failed during database insertion: ${err.message}`);
    }
  }
}
