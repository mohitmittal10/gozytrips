import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Centralized service to update itinerary status.
 * Ensures that all status transitions reliably write to `itinerary_status_events`
 * so that we don't lose pipeline timeline data (Short-Term Memory fix).
 */
export async function updateItineraryStatus(
    tripId: string,
    newStatus: string,
    supabase: SupabaseClient,
    userId: string,
    oldStatusFallback?: string
) {
    if (!tripId || !userId) return;

    const statusToSave = newStatus.toLowerCase() === 'confirmed' ? 'booked' : newStatus.toLowerCase();

    try {
        // 1. Fetch current status to determine the true 'oldStatus' if not provided reliably
        let oldStatus = oldStatusFallback || "unknown";
        const { data: existingTrip } = await supabase
            .from("itineraries")
            .select("status")
            .eq("id", tripId)
            .single();

        if (existingTrip) {
            oldStatus = existingTrip.status || "unknown";
        }

        // If the status hasn't actually changed, we don't need to log a timeline event
        if (oldStatus === statusToSave && oldStatus !== "unknown") {
            return; 
        }

        // 2. Perform the update on itineraries (including the last_activity_at bump)
        const { error: updateError } = await supabase
            .from("itineraries")
            .update({ 
                status: statusToSave,
                last_activity_at: new Date().toISOString()
            })
            .eq("id", tripId)
            .eq("user_id", userId);

        if (updateError) throw updateError;

        // 3. Log the history transition event
        const { error: historyError } = await supabase
            .from("itinerary_status_events")
            .insert([{
                user_id: userId,
                itinerary_id: tripId,
                from_status: oldStatus,
                to_status: statusToSave,
                changed_by: userId,
                notes: "Status updated via centralized action"
            }]);

        if (historyError) {
            console.error("[ItineraryStatus Service] Failed to log status history event:", historyError);
        }
    } catch (err) {
        console.error("[ItineraryStatus Service] Error updating itinerary status:", err);
        throw err;
    }
}
