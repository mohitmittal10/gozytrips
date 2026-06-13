/**
 * ItineraryService.ts
 *
 * Authoritative module for all itinerary and vendor-enquiry persistence operations.
 *
 * Consolidates:
 *  - src/lib/itinerary-service.ts            (saveItinerary)
 *  - src/lib/services/itinerary-status.ts    (updateItineraryStatus)
 *  - src/lib/services/vendor-enquiry.ts      (vendorEnquiryService)
 *
 * Bug fixed: vendor-enquiry previously created a module-level Supabase client
 * (side-effect at import time). All methods now create the client internally,
 * making the module safe for SSR and server components.
 */

import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { VendorEnquiry } from '@/types/vendor-enquiry';

// ─────────────────────────────────────────────────────────────────────────────
// Itinerary CRUD (from itinerary-service.ts)
// ─────────────────────────────────────────────────────────────────────────────

export interface SaveItineraryPayload {
  title: string;
  description?: string;
  startingLocation: string;
  endingLocation?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  destinations: string;
  budget?: number;
  walkingDistance?: number;
  mustInclude?: string;
  avoid?: string;
  itineraryData: TravelItineraryOutput;
}

/**
 * Persists a new AI-generated itinerary to Supabase.
 */
export async function saveItinerary(userId: string, payload: SaveItineraryPayload) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('itineraries')
    .insert([
      {
        user_id: userId,
        title: payload.title,
        description: payload.description || null,
        starting_location: payload.startingLocation,
        ending_location: payload.endingLocation || null,
        start_date: payload.startDate,
        end_date: payload.endDate,
        start_time: payload.startTime,
        end_time: payload.endTime,
        destinations: payload.destinations,
        budget: payload.budget || null,
        walking_distance: payload.walkingDistance || null,
        must_include: payload.mustInclude || null,
        avoid: payload.avoid || null,
        itinerary_data: payload.itineraryData,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Transitions (from itinerary-status.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centralized status updater.
 * Writes to `itineraries` and logs the transition to `itinerary_status_events`,
 * ensuring we never lose pipeline timeline data.
 *
 * @param supabase  Caller-provided client — allows server routes to pass service-role client.
 */
export async function updateItineraryStatus(
  tripId: string,
  newStatus: string,
  supabase: SupabaseClient,
  userId: string,
  oldStatusFallback?: string,
): Promise<void> {
  if (!tripId || !userId) return;

  const statusToSave = newStatus.toLowerCase() === 'confirmed' ? 'booked' : newStatus.toLowerCase();

  try {
    let oldStatus = oldStatusFallback || 'unknown';
    const { data: existingTrip } = await supabase
      .from('itineraries')
      .select('status')
      .eq('id', tripId)
      .single();

    if (existingTrip) {
      oldStatus = existingTrip.status || 'unknown';
    }

    // No-op if status hasn't changed
    if (oldStatus === statusToSave && oldStatus !== 'unknown') return;

    const { error: updateError } = await supabase
      .from('itineraries')
      .update({ status: statusToSave, last_activity_at: new Date().toISOString() })
      .eq('id', tripId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Synchronize status with client enquiry responses if applicable
    let workflowStatus: string | null = null;
    if (statusToSave === 'draft') workflowStatus = 'submitted';
    else if (statusToSave === 'proposed') workflowStatus = 'under_review';
    else if (statusToSave === 'sent') workflowStatus = 'itinerary_ready';
    else if (statusToSave === 'booked') workflowStatus = 'booked';

    if (workflowStatus) {
      const { error: syncError } = await supabase
        .from('client_enquiry_responses')
        .update({ workflow_status: workflowStatus })
        .eq('converted_itinerary_id', tripId);
      
      if (syncError) {
        console.error('[ItineraryService] Failed to sync client enquiry response status:', syncError);
      }
    }

    const { error: historyError } = await supabase.from('itinerary_status_events').insert([
      {
        user_id: userId,
        itinerary_id: tripId,
        from_status: oldStatus,
        to_status: statusToSave,
        changed_by: userId,
        notes: 'Status updated via centralized action',
      },
    ]);

    if (historyError) {
      console.error('[ItineraryService] Failed to log status history event:', historyError);
    }
  } catch (err) {
    console.error('[ItineraryService] Error updating itinerary status:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vendor Enquiries (from vendor-enquiry.ts)
// Bug fixed: createClient() is now called inside each method, not at module level.
// ─────────────────────────────────────────────────────────────────────────────

export const vendorEnquiryService = {
  async fetchPastEnquiries(userId: string): Promise<VendorEnquiry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('vendor_enquiries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ItineraryService] Failed to fetch past enquiries:', error);
      throw error;
    }
    return data || [];
  },

  async fetchUserItineraries(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('itineraries')
      .select('id, title')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ItineraryService] Failed to fetch itineraries:', error);
      throw error;
    }
    return data || [];
  },

  async saveEnquiry(data: Partial<VendorEnquiry>): Promise<VendorEnquiry> {
    const supabase = createClient();
    const { id, ...payload } = data;

    if (id) {
      const { data: updated, error } = await supabase
        .from('vendor_enquiries')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[ItineraryService] Failed to update enquiry:', error.message, error.details, error.hint);
        throw error;
      }
      return updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('vendor_enquiries')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[ItineraryService] Failed to insert enquiry:', error.message, error.details, error.hint);
        throw error;
      }
      return inserted;
    }
  },

  async deleteEnquiry(enqId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('vendor_enquiries').delete().eq('id', enqId);
    if (error) {
      console.error('[ItineraryService] Failed to delete enquiry:', error);
      throw error;
    }
  },
};

