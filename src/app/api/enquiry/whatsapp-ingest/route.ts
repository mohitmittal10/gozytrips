import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/input-sanitizer";
import type { ExtractedWhatsAppLead, IngestedWhatsAppLeadRecord } from "@/types/enquiry";

// Helper to safely format phone numbers
function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.trim().replace(/[\s\-()]/g, "");
}

// GET /api/enquiry/whatsapp-ingest — Fetch all ingested WhatsApp leads for the agent
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query responses joining forms to ensure user ownership and filter by source = 'whatsapp_ingest'
    const { data: responses, error } = await (supabase as any)
      .from("client_enquiry_responses")
      .select(`
        id, form_id, client_id, client_name, client_email, status,
        starting_location, destinations, ending_location, start_date, end_date,
        adult_pax, child_pax, infant_pax, trip_type, travel_methods,
        budget, currency, must_include, avoid, special_requests,
        raw_payload, submitted_at, converted_at, converted_itinerary_id,
        client_enquiry_forms!inner(user_id)
      `)
      .eq("client_enquiry_forms.user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    // Filter to whatsapp and meta lead responses
    const filtered = (responses || []).filter((r: any) => {
      const src = r.raw_payload?.source;
      return (
        src === "whatsapp_ingest" ||
        src === "whatsapp_cloud" ||
        src === "meta_lead_ad" ||
        src === "meta_whatsapp" ||
        src === "instagram_direct" ||
        (typeof src === "string" && (src.startsWith("whatsapp") || src.startsWith("meta")))
      );
    });

    // Also get client phones if linked
    const clientIds = filtered.map((r: any) => r.client_id).filter(Boolean);
    let clientPhoneMap: Record<string, string> = {};

    if (clientIds.length > 0) {
      const { data: clients } = await (supabase as any)
        .from("clients")
        .select("id, phone")
        .in("id", clientIds);

      for (const c of clients || []) {
        if (c.phone) clientPhoneMap[c.id] = c.phone;
      }
    }

    const leads: IngestedWhatsAppLeadRecord[] = filtered.map((r: any) => {
      const payload = r.raw_payload || {};
      const phone = clientPhoneMap[r.client_id] || payload.phone || "";

      return {
        id: r.id,
        formId: r.form_id,
        clientId: r.client_id,
        clientName: r.client_name || "Unknown Traveler",
        clientEmail: r.client_email || "",
        phone: phone,
        destinations: r.destinations || "Unspecified",
        startingLocation: r.starting_location || "New Delhi",
        startDate: r.start_date,
        endDate: r.end_date,
        durationDays: payload.durationDays || null,
        adultPax: r.adult_pax || 1,
        childPax: r.child_pax || 0,
        infantPax: r.infant_pax || 0,
        budget: r.budget,
        currency: r.currency || "INR",
        tripType: r.trip_type,
        status: r.status,
        urgency: payload.urgency || "normal",
        confidenceScore: payload.confidenceScore ?? 85,
        summary: payload.keySummary || "WhatsApp / Meta inquiry",
        suggestedWhatsAppReply: payload.suggestedWhatsAppReply || "",
        rawChat: payload.rawChat || "",
        channelSource: payload.channelSource || payload.source || "whatsapp_direct",
        submittedAt: r.submitted_at,
        convertedAt: r.converted_at,
        convertedItineraryId: r.converted_itinerary_id,
      };
    });

    return NextResponse.json({ success: true, leads });
  } catch (err: any) {
    console.error("[whatsapp-ingest GET]", err);
    return NextResponse.json({ error: err.message || "Failed to load WhatsApp leads" }, { status: 500 });
  }
}

// POST /api/enquiry/whatsapp-ingest — Persist a parsed WhatsApp lead to CRM
export async function POST(req: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const lead: ExtractedWhatsAppLead = body.lead;
    const linkExistingClientId: string | undefined = body.linkExistingClientId;
    const createNewClient: boolean = body.createClient ?? true;

    if (!lead || !lead.destinations) {
      return NextResponse.json({ error: "Invalid lead data. Destination is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Find or create the default "WhatsApp Leads" form for this agent
    let formId: string | null = null;
    const { data: existingForm } = await (admin as any)
      .from("client_enquiry_forms")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", "WhatsApp Leads")
      .maybeSingle();

    if (existingForm) {
      formId = existingForm.id;
    } else {
      const { data: newForm, error: formError } = await (admin as any)
        .from("client_enquiry_forms")
        .insert({
          user_id: user.id,
          title: "WhatsApp Leads",
          description: "Ingested inquiries and leads from WhatsApp conversations",
          status: "active",
        })
        .select("id")
        .single();

      if (formError || !newForm) {
        throw new Error(formError?.message || "Failed to create default WhatsApp enquiry form");
      }
      formId = newForm.id;
    }

    // 2. Client Resolution (Find existing, Link, or Create new)
    let resolvedClientId: string | null = linkExistingClientId || null;
    const normalizedPhone = normalizePhone(lead.phone);

    if (!resolvedClientId && normalizedPhone) {
      // Check if client with this phone already exists for this agent
      const { data: matchingClient } = await (admin as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .ilike("phone", `%${normalizedPhone.slice(-10)}%`)
        .maybeSingle();

      if (matchingClient) {
        resolvedClientId = matchingClient.id;
      }
    }

    if (!resolvedClientId && lead.email) {
      const { data: matchingByEmail } = await (admin as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .ilike("email", lead.email.trim())
        .maybeSingle();

      if (matchingByEmail) {
        resolvedClientId = matchingByEmail.id;
      }
    }

    // If still no client and createNewClient is true, insert into clients table
    if (!resolvedClientId && createNewClient) {
      const clientName = sanitizeText(lead.clientName || "WhatsApp Traveler", 100);
      const notes = [
        `Ingested via WhatsApp on ${new Date().toLocaleDateString()}.`,
        lead.keySummary ? `Summary: ${lead.keySummary}` : "",
        lead.budget ? `Budget: ${lead.currency} ${lead.budget.toLocaleString()}` : "",
      ].filter(Boolean).join("\n");

      const { data: newClient, error: clientErr } = await (admin as any)
        .from("clients")
        .insert({
          user_id: user.id,
          name: clientName,
          phone: lead.phone || null,
          email: lead.email || null,
          notes: notes,
          tags: ["whatsapp-lead", lead.tripType || "trip"].filter(Boolean),
        })
        .select("id")
        .single();

      if (!clientErr && newClient) {
        resolvedClientId = newClient.id;
      }
    }

    // 3. Fallback email if client has none
    const clientEmail = lead.email || (
      normalizedPhone
        ? `${normalizedPhone.replace(/[^0-9]/g, '')}@whatsapp.placeholder`
        : `wa-${Date.now()}@placeholder.gozytrips.com`
    );

    // 4. Insert into client_enquiry_responses
    const leadSource = body.source || (lead as any).channelSource || "whatsapp_ingest";
    const rawPayload = {
      source: leadSource,
      channelSource: body.channelSource || (lead as any).channelSource || leadSource,
      phone: lead.phone || "",
      urgency: lead.urgency || "normal",
      confidenceScore: lead.confidenceScore ?? 85,
      keySummary: lead.keySummary || "",
      suggestedWhatsAppReply: lead.suggestedWhatsAppReply || "",
      hotelPreference: lead.hotelPreference || null,
      mealPlan: lead.mealPlan || null,
      durationDays: lead.durationDays || null,
      rawChat: lead.rawChat || "",
    };

    const { data: responseRecord, error: responseErr } = await (admin as any)
      .from("client_enquiry_responses")
      .insert({
        form_id: formId,
        client_id: resolvedClientId,
        client_name: sanitizeText(lead.clientName || "WhatsApp Traveler", 100),
        client_email: clientEmail,
        status: "pending",
        starting_location: sanitizeText(lead.startingLocation || "New Delhi", 100),
        destinations: sanitizeText(lead.destinations, 200),
        start_date: lead.startDate || null,
        end_date: lead.endDate || null,
        adult_pax: Math.max(1, lead.adultPax || 1),
        child_pax: Math.max(0, lead.childPax || 0),
        infant_pax: Math.max(0, lead.infantPax || 0),
        trip_type: lead.tripType || null,
        travel_methods: lead.travelMethods || ["Flight"],
        budget: lead.budget || null,
        currency: lead.currency || "INR",
        must_include: lead.mustInclude ? sanitizeText(lead.mustInclude, 500) : null,
        avoid: lead.avoid ? sanitizeText(lead.avoid, 500) : null,
        special_requests: lead.specialRequests ? sanitizeText(lead.specialRequests, 500) : null,
        raw_payload: rawPayload,
      })
      .select("id")
      .single();

    if (responseErr || !responseRecord) {
      throw new Error(responseErr?.message || "Failed to persist enquiry response");
    }

    const redirectUrl = `/the-lab?enquiry=${responseRecord.id}`;

    return NextResponse.json({
      success: true,
      responseId: responseRecord.id,
      clientId: resolvedClientId,
      formId: formId,
      redirectUrl: redirectUrl,
      message: "Lead successfully ingested and saved to CRM!",
    });
  } catch (err: any) {
    console.error("[whatsapp-ingest POST]", err);
    return NextResponse.json({ error: err.message || "Failed to ingest WhatsApp lead" }, { status: 500 });
  }
}

// DELETE /api/enquiry/whatsapp-ingest — Delete an ingested response
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const responseId = url.searchParams.get("responseId");

    if (!responseId) {
      return NextResponse.json({ error: "responseId parameter is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify ownership via form join
    const { data: response } = await (admin as any)
      .from("client_enquiry_responses")
      .select("id, client_enquiry_forms!inner(user_id)")
      .eq("id", responseId)
      .eq("client_enquiry_forms.user_id", user.id)
      .maybeSingle();

    if (!response) {
      return NextResponse.json({ error: "Lead response not found or forbidden" }, { status: 404 });
    }

    await (admin as any)
      .from("client_enquiry_responses")
      .delete()
      .eq("id", responseId);

    return NextResponse.json({ success: true, message: "Lead removed" });
  } catch (err: any) {
    console.error("[whatsapp-ingest DELETE]", err);
    return NextResponse.json({ error: err.message || "Failed to delete lead" }, { status: 500 });
  }
}
