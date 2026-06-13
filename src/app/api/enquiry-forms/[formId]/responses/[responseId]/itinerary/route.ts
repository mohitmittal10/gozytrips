import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/enquiry-forms/[formId]/responses/[responseId]/itinerary
 *
 * Returns the live itinerary data for a linked enquiry response.
 * Only accessible to:
 *  - The agent who owns the form
 *  - The client who submitted the response
 *
 * Returns 403 if itinerary_visible_to_client = false AND caller is the client.
 * Agent can always read regardless.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ formId: string; responseId: string }> }
) {
  try {
    const { formId, responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch the enquiry response with form ownership info
    const { data: response, error: respError } = await (admin as any)
      .from("client_enquiry_responses")
      .select(`
        id,
        converted_itinerary_id,
        itinerary_visible_to_client,
        itinerary_last_pushed_at,
        client_user_id,
        client_enquiry_forms!inner(user_id)
      `)
      .eq("id", responseId)
      .eq("form_id", formId)
      .maybeSingle();

    if (respError || !response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const isAgent = (response as any).client_enquiry_forms?.user_id === user.id;
    const isClient = response.client_user_id === user.id;

    if (!isAgent && !isClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Client can only see itinerary when agent has explicitly pushed it
    if (isClient && !isAgent && !response.itinerary_visible_to_client) {
      return NextResponse.json({
        available: false,
        message: "Itinerary not yet shared by your agent."
      });
    }

    if (!response.converted_itinerary_id) {
      return NextResponse.json({
        available: false,
        message: "No itinerary linked to this enquiry yet."
      });
    }

    // Fetch the live itinerary from the DB
    // NOTE: inclusions/exclusions are stored inside itinerary_data JSON, not as top-level columns
    const { data: itinerary, error: itinError } = await (admin as any)
      .from("itineraries")
      .select(`
        id,
        title,
        status,
        destinations,
        starting_location,
        ending_location,
        start_date,
        end_date,
        adult_pax,
        child_pax,
        infant_pax,
        itinerary_data,
        show_timestamps,
        client_price,
        currency,
        markup_value,
        markup_type,
        tax_percentage,
        costing_type,
        updated_at,
        share_token,
        share_enabled
      `)
      .eq("id", response.converted_itinerary_id)
      .maybeSingle();

    if (itinError) {
      console.error("[GET itinerary for client portal] DB error fetching itinerary:", itinError);
      return NextResponse.json({ error: "Failed to load itinerary" }, { status: 500 });
    }

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    // Surface all itinerary_data sections and agent settings for the client view
    const itineraryData = itinerary.itinerary_data as any;
    const enrichedItinerary = {
      ...itinerary,
      inclusions:          itineraryData?.inclusions          ?? null,
      exclusions:          itineraryData?.exclusions          ?? null,
      termsAndConditions:  itineraryData?.termsAndConditions  ?? null,
      cancellationPolicy:  itineraryData?.cancellationPolicy  ?? null,
      paymentMethods:      itineraryData?.paymentMethods      ?? null,
      hotels:              itineraryData?.hotels              ?? [],
      flights:             itineraryData?.flights             ?? [],
      cabs:                itineraryData?.cabs                ?? [],
      buses:               itineraryData?.buses               ?? [],
      // pricing config (used for cost breakdown display)
      pricing:             itineraryData?.pricing             ?? null,
      // show_timestamps is a top-level DB column
      show_timestamps: itinerary.show_timestamps ?? true,
    };

    return NextResponse.json({
      available: true,
      itinerary: enrichedItinerary,
      itinerary_last_pushed_at: response.itinerary_last_pushed_at,
    });
  } catch (err: any) {
    console.error("[GET itinerary for client portal]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
