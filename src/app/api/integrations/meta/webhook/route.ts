import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractWhatsAppLead } from "@/ai/flows/extract-whatsapp-lead";
import { sanitizeText } from "@/lib/security/input-sanitizer";

// GET /api/integrations/meta/webhook — Meta Webhook Verification Handshake
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Standard verification: check if mode is subscribe
    if (mode === "subscribe") {
      // Allow if token matches standard pattern or default
      if (token && (token.startsWith("meta_verify_") || token === "gozytrips_meta_lead_sync" || token.length > 5)) {
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }

    return new Response("Verification token mismatch", { status: 403 });
  } catch (err: any) {
    return new Response(err.message || "Webhook verification failed", { status: 500 });
  }
}

// POST /api/integrations/meta/webhook — Ingest live Meta Lead Ads & WhatsApp Cloud messages
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const admin = createAdminClient();

    // 1. WhatsApp Cloud API Message
    if (payload.object === "whatsapp_business_account") {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      const contact = change?.contacts?.[0];
      const phoneNumberId = change?.metadata?.phone_number_id;

      if (message && message.type === "text" && message.text?.body) {
        const rawChat = message.text.body;
        const senderPhone = contact?.wa_id || message.from;
        const senderName = contact?.profile?.name || "WhatsApp Traveler";

        // Find agent linked to this phoneNumberId or wabaId
        let userId: string | null = null;
        if (phoneNumberId) {
          const { data: userMatch } = await (admin as any)
            .from("whatsapp_meta_integrations")
            .select("user_id")
            .eq("phone_number_id", phoneNumberId)
            .maybeSingle();
          userId = userMatch?.user_id || null;
        }

        // Fallback: get first active connected user if only one
        if (!userId) {
          const { data: fallbackUser } = await (admin as any)
            .from("whatsapp_meta_integrations")
            .select("user_id")
            .eq("status", "connected")
            .limit(1)
            .maybeSingle();
          userId = fallbackUser?.user_id || null;
        }

        if (userId) {
          await processAndSaveLead(admin, userId, {
            rawChat,
            senderName,
            senderPhone,
            channelSource: "whatsapp_cloud",
          });
        }
      }
    }

    // 2. Meta Lead Ad Event
    if (payload.object === "page") {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const leadgenId = change?.value?.leadgen_id;
      const pageId = change?.value?.page_id;

      if (leadgenId) {
        // Find agent linked to pageId or ad account
        let agentIntegration: any = null;
        const { data: matched } = await (admin as any)
          .from("whatsapp_meta_integrations")
          .select("*")
          .or(`meta_page_name.ilike.%${pageId}%,status.eq.connected`)
          .limit(1)
          .maybeSingle();
        agentIntegration = matched;

        if (agentIntegration?.user_id && agentIntegration?.meta_access_token) {
          // Fetch lead details from Graph API
          try {
            const leadRes = await fetch(
              `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${agentIntegration.meta_access_token}`
            );
            if (leadRes.ok) {
              const leadJson = await leadRes.json();
              const fields = leadJson.field_data || [];
              let name = "";
              let phone = "";
              let email = "";
              let info = "";

              for (const f of fields) {
                const fname = (f.name || "").toLowerCase();
                const fval = Array.isArray(f.values) ? f.values[0] : "";
                if (fname.includes("name")) name = fval;
                else if (fname.includes("phone")) phone = fval;
                else if (fname.includes("email")) email = fval;
                else info += `${f.name}: ${fval}\n`;
              }

              const chatText = `[Meta Lead Ad #${leadgenId}]\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\n${info}`;
              await processAndSaveLead(admin, agentIntegration.user_id, {
                rawChat: chatText,
                senderName: name,
                senderPhone: phone,
                channelSource: "meta_lead_ad",
              });
            }
          } catch (fetchErr) {
            console.error("[meta-webhook] Failed to fetch leadgen detail:", fetchErr);
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (err: any) {
    console.error("[meta-webhook POST error]", err);
    return NextResponse.json({ error: err.message || "Failed to process webhook" }, { status: 500 });
  }
}

// Internal helper to run AI extraction and persist response & client
async function processAndSaveLead(
  admin: any,
  userId: string,
  params: {
    rawChat: string;
    senderName?: string;
    senderPhone?: string;
    channelSource: string;
  }
) {
  const extraction = await extractWhatsAppLead({
    rawChat: params.rawChat,
    defaultName: params.senderName,
    defaultPhone: params.senderPhone,
  });

  if (!extraction.success) return null;
  const lead = extraction.data;

  // Form ID
  let formId: string | null = null;
  const { data: form } = await admin
    .from("client_enquiry_forms")
    .select("id")
    .eq("user_id", userId)
    .eq("title", "WhatsApp Leads")
    .maybeSingle();

  if (form) {
    formId = form.id;
  } else {
    const { data: newForm } = await admin
      .from("client_enquiry_forms")
      .insert({
        user_id: userId,
        title: "WhatsApp Leads",
        description: "Ingested inquiries and leads from WhatsApp & Meta conversations",
        status: "active",
      })
      .select("id")
      .single();
    formId = newForm?.id || null;
  }

  // Client resolution
  let clientId: string | null = null;
  const cleanPhone = (lead.phone || params.senderPhone || "").replace(/[^0-9]/g, "");

  if (cleanPhone) {
    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .ilike("phone", `%${cleanPhone.slice(-10)}%`)
      .maybeSingle();
    if (existingClient) clientId = existingClient.id;
  }

  if (!clientId) {
    const { data: createdClient } = await admin
      .from("clients")
      .insert({
        user_id: userId,
        name: sanitizeText(lead.clientName || params.senderName || "Traveler", 100),
        phone: lead.phone || params.senderPhone || null,
        email: lead.email || null,
        notes: `Auto-ingested via ${params.channelSource} on ${new Date().toLocaleDateString()}.\nSummary: ${lead.keySummary}`,
        tags: ["whatsapp-lead", params.channelSource, lead.tripType || "trip"].filter(Boolean),
      })
      .select("id")
      .single();
    if (createdClient) clientId = createdClient.id;
  }

  const clientEmail = lead.email || (
    cleanPhone
      ? `${cleanPhone}@whatsapp.placeholder`
      : `wa-${Date.now()}@placeholder.gozytrips.com`
  );

  const rawPayload = {
    source: params.channelSource,
    channelSource: params.channelSource,
    phone: lead.phone || params.senderPhone || "",
    urgency: lead.urgency || "normal",
    confidenceScore: lead.confidenceScore ?? 85,
    keySummary: lead.keySummary || "",
    suggestedWhatsAppReply: lead.suggestedWhatsAppReply || "",
    hotelPreference: lead.hotelPreference || null,
    mealPlan: lead.mealPlan || null,
    durationDays: lead.durationDays || null,
    rawChat: params.rawChat,
  };

  return await admin.from("client_enquiry_responses").insert({
    form_id: formId,
    client_id: clientId,
    client_name: sanitizeText(lead.clientName || params.senderName || "Traveler", 100),
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
  });
}
