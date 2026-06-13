import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateItineraryStatus } from "@/services/itinerary/ItineraryService";

// GET /api/enquiry-forms/[formId]/responses/[responseId]
// Used by the client dashboard to fetch their own submission data
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

    // Agent can fetch any response on their form
    // Client can only fetch their own response
    const { data: response, error } = await (supabase as any)
      .from("client_enquiry_responses")
      .select(`
        *,
        client_enquiry_forms!inner(user_id, title, description, agent_brand_name:clients(name))
      `)
      .eq("id", responseId)
      .eq("form_id", formId)
      .maybeSingle();

    if (error || !response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const isAgent = (response as any).client_enquiry_forms?.user_id === user.id;
    const isClient = response.client_user_id === user.id;

    if (!isAgent && !isClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ response });
  } catch (err: any) {
    console.error("[response GET single]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/enquiry-forms/[formId]/responses/[responseId]
// Agent-only: update agent_note, itinerary_share_url, workflow_status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string; responseId: string }> }
) {
  try {
    const { formId, responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only agents can patch — verify form ownership
    const { data: form } = await (supabase as any)
      .from("client_enquiry_forms")
      .select("id")
      .eq("id", formId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!form) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.agent_note !== undefined) {
      updates.agent_note = body.agent_note || null;
      updates.agent_note_updated_at = new Date().toISOString();
    }
    if (body.itinerary_share_url !== undefined) {
      updates.itinerary_share_url = body.itinerary_share_url || null;
    }
    if (body.workflow_status !== undefined) {
      const allowed = ["submitted", "under_review", "itinerary_ready", "booked"];
      if (!allowed.includes(body.workflow_status)) {
        return NextResponse.json({ error: "Invalid workflow_status" }, { status: 400 });
      }
      updates.workflow_status = body.workflow_status;
    }
    // Agent can manually link a Lab itinerary (or update the link)
    if (body.converted_itinerary_id !== undefined) {
      updates.converted_itinerary_id = body.converted_itinerary_id || null;
    }
    // Agent explicitly pushes itinerary to client dashboard
    if (body.itinerary_visible_to_client !== undefined) {
      updates.itinerary_visible_to_client = Boolean(body.itinerary_visible_to_client);
      if (body.itinerary_visible_to_client) {
        updates.itinerary_last_pushed_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: updated, error: updateError } = await (admin as any)
      .from("client_enquiry_responses")
      .update(updates)
      .eq("id", responseId)
      .eq("form_id", formId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Synchronize status back to itineraries table if converted_itinerary_id exists
    if (updated.converted_itinerary_id && updates.workflow_status) {
      let itineraryStatus = "draft";
      if (updates.workflow_status === "under_review") itineraryStatus = "proposed";
      else if (updates.workflow_status === "itinerary_ready") itineraryStatus = "sent";
      else if (updates.workflow_status === "booked") itineraryStatus = "booked";

      try {
        await updateItineraryStatus(updated.converted_itinerary_id, itineraryStatus, admin as any, user.id);
      } catch (err) {
        console.error("[response PATCH] Failed to update itinerary status:", err);
      }
    }

    return NextResponse.json({ response: updated });
  } catch (err: any) {
    console.error("[response PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
