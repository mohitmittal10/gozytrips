import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractWhatsAppLead } from "@/ai/flows/extract-whatsapp-lead";
import { sanitizeText } from "@/lib/security/input-sanitizer";

export async function POST(req: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch user's WhatsApp & Meta integration settings
    let integrationData: any = null;
    try {
      const { data } = await (admin as any)
        .from("whatsapp_meta_integrations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      integrationData = data;
    } catch (e) {
      // ignore
    }

    if (!integrationData) {
      const { data: prefData } = await (admin as any)
        .from("user_preferences")
        .select("my_trips_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      integrationData = prefData?.my_trips_preferences?.whatsapp_meta_integration;
    }

    if (!integrationData || !integrationData.status || integrationData.status === "disconnected") {
      return NextResponse.json(
        {
          error: "No WhatsApp or Meta account connected. Please connect your account first to fetch live leads.",
          code: "NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    const accessToken = integrationData.meta_access_token || integrationData.metaAccessToken;
    const formId = integrationData.meta_form_id || integrationData.metaFormId;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Meta Access Token is missing. Please add your Meta Access Token in connection settings to fetch actual leads from Meta Graph API.",
          code: "NO_TOKEN",
        },
        { status: 400 }
      );
    }

    if (!formId) {
      return NextResponse.json(
        {
          error: "No Meta Lead Generation Form selected. Please select a Lead Form in connection settings to fetch actual submitted leads.",
          code: "NO_FORM",
        },
        { status: 400 }
      );
    }

    // 2. Query Meta Graph API for actual submitted leads from this Lead Gen Form
    const metaUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(formId)}/leads?fields=id,created_time,field_data,ad_name,campaign_name,form_id&limit=50&access_token=${encodeURIComponent(accessToken)}`;
    
    const metaRes = await fetch(metaUrl);
    const metaJson = await metaRes.json();

    if (metaJson.error) {
      return NextResponse.json(
        {
          error: `Meta Graph API Error: ${metaJson.error.message || "Failed to retrieve leads from Meta"}`,
          code: metaJson.error.code,
        },
        { status: 400 }
      );
    }

    const rawMetaLeads: any[] = Array.isArray(metaJson.data) ? metaJson.data : [];

    if (rawMetaLeads.length === 0) {
      // Update last synced timestamp
      await updateLastSynced(admin, user.id);
      return NextResponse.json({
        success: true,
        newLeadsCount: 0,
        totalMetaLeads: 0,
        message: "Sync complete: No submitted leads found in this Meta form yet.",
      });
    }

    // 3. Find or create the default "WhatsApp & Meta Leads" form for this agent
    let crmFormId: string | null = null;
    const { data: existingForm } = await (admin as any)
      .from("client_enquiry_forms")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", "WhatsApp Leads")
      .maybeSingle();

    if (existingForm) {
      crmFormId = existingForm.id;
    } else {
      const { data: newForm } = await (admin as any)
        .from("client_enquiry_forms")
        .insert({
          user_id: user.id,
          title: "WhatsApp Leads",
          description: "Ingested inquiries and leads from WhatsApp & Meta conversations",
          status: "active",
        })
        .select("id")
        .single();
      crmFormId = newForm?.id || null;
    }

    // 4. Fetch existing leads for this user to avoid duplicating already ingested Meta leads
    const { data: existingResponses } = await (admin as any)
      .from("client_enquiry_responses")
      .select("id, raw_payload, client_enquiry_forms!inner(user_id)")
      .eq("client_enquiry_forms.user_id", user.id);

    const alreadyIngestedMetaIds = new Set<string>();
    for (const r of existingResponses || []) {
      const metaId = r.raw_payload?.meta_lead_id;
      if (metaId) alreadyIngestedMetaIds.add(String(metaId));
    }

    // 5. Ingest each new real Meta lead
    const newIngestedResults = [];

    for (const metaLead of rawMetaLeads) {
      const metaLeadId = String(metaLead.id);
      if (alreadyIngestedMetaIds.has(metaLeadId)) {
        // Skip already ingested lead
        continue;
      }

      // Parse fields submitted by traveler
      const fieldData: Array<{ name: string; values: string[] }> = metaLead.field_data || [];
      let travelerName = "";
      let travelerPhone = "";
      let travelerEmail = "";
      let questionAnswersText = "";

      for (const field of fieldData) {
        const fieldName = (field.name || "").toLowerCase();
        const fieldValue = Array.isArray(field.values) && field.values.length > 0 ? field.values[0] : "";
        if (!fieldValue) continue;

        if (fieldName.includes("full_name") || fieldName.includes("first_name") || fieldName === "name") {
          travelerName = fieldValue;
        } else if (fieldName.includes("phone")) {
          travelerPhone = fieldValue;
        } else if (fieldName.includes("email")) {
          travelerEmail = fieldValue;
        } else {
          questionAnswersText += `${field.name}: ${fieldValue}\n`;
        }
      }

      // Reconstruct actual chat/lead transcript
      const leadTranscript = [
        `[Meta Lead Ad #${metaLeadId}]`,
        metaLead.campaign_name ? `Campaign: ${metaLead.campaign_name}` : "",
        metaLead.ad_name ? `Ad: ${metaLead.ad_name}` : "",
        travelerName ? `Name: ${travelerName}` : "",
        travelerPhone ? `Phone: ${travelerPhone}` : "",
        travelerEmail ? `Email: ${travelerEmail}` : "",
        questionAnswersText.trim(),
      ].filter(Boolean).join("\n");

      // Run AI Extraction on the actual traveler submission
      const extraction = await extractWhatsAppLead({
        rawChat: leadTranscript,
        defaultName: travelerName || undefined,
        defaultPhone: travelerPhone || undefined,
      });

      if (!extraction.success) {
        continue;
      }

      const extracted = extraction.data;

      // Client resolution
      let resolvedClientId: string | null = null;
      const cleanPhone = (extracted.phone || travelerPhone).replace(/[^0-9]/g, "");

      if (cleanPhone) {
        const { data: matchedClient } = await (admin as any)
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .ilike("phone", `%${cleanPhone.slice(-10)}%`)
          .maybeSingle();
        if (matchedClient) resolvedClientId = matchedClient.id;
      }

      if (!resolvedClientId) {
        const { data: newClient } = await (admin as any)
          .from("clients")
          .insert({
            user_id: user.id,
            name: sanitizeText(extracted.clientName || travelerName || "Meta Traveler", 100),
            phone: extracted.phone || travelerPhone || null,
            email: extracted.email || travelerEmail || null,
            notes: `Live lead ingested from Meta Lead Form on ${new Date().toLocaleDateString()}.\nSummary: ${extracted.keySummary}`,
            tags: ["meta-lead", "lead-ad", extracted.tripType || "trip"].filter(Boolean),
          })
          .select("id")
          .single();
        if (newClient) resolvedClientId = newClient.id;
      }

      const clientEmail = extracted.email || travelerEmail || (
        cleanPhone
          ? `${cleanPhone}@meta.placeholder`
          : `meta-${metaLeadId}@placeholder.gozytrips.com`
      );

      const rawPayload = {
        source: "meta_lead_ad",
        channelSource: "meta_lead_ad",
        meta_lead_id: metaLeadId,
        meta_form_id: formId,
        meta_ad_name: metaLead.ad_name || null,
        meta_campaign_name: metaLead.campaign_name || null,
        meta_created_time: metaLead.created_time || null,
        phone: extracted.phone || travelerPhone || "",
        urgency: extracted.urgency || "normal",
        confidenceScore: extracted.confidenceScore ?? 90,
        keySummary: extracted.keySummary || "Meta Lead Ad inquiry",
        suggestedWhatsAppReply: extracted.suggestedWhatsAppReply || "",
        hotelPreference: extracted.hotelPreference || null,
        mealPlan: extracted.mealPlan || null,
        durationDays: extracted.durationDays || null,
        rawChat: leadTranscript,
        field_data: fieldData,
      };

      const { data: responseRecord } = await (admin as any)
        .from("client_enquiry_responses")
        .insert({
          form_id: crmFormId,
          client_id: resolvedClientId,
          client_name: sanitizeText(extracted.clientName || travelerName || "Traveler", 100),
          client_email: clientEmail,
          status: "pending",
          starting_location: sanitizeText(extracted.startingLocation || "New Delhi", 100),
          destinations: sanitizeText(extracted.destinations, 200),
          start_date: extracted.startDate || null,
          end_date: extracted.endDate || null,
          adult_pax: Math.max(1, extracted.adultPax || 1),
          child_pax: Math.max(0, extracted.childPax || 0),
          infant_pax: Math.max(0, extracted.infantPax || 0),
          trip_type: extracted.tripType || null,
          travel_methods: extracted.travelMethods || ["Flight"],
          budget: extracted.budget || null,
          currency: extracted.currency || "INR",
          must_include: extracted.mustInclude ? sanitizeText(extracted.mustInclude, 500) : null,
          avoid: extracted.avoid ? sanitizeText(extracted.avoid, 500) : null,
          special_requests: extracted.specialRequests ? sanitizeText(extracted.specialRequests, 500) : null,
          raw_payload: rawPayload,
        })
        .select("id")
        .single();

      if (responseRecord) {
        newIngestedResults.push({
          id: responseRecord.id,
          metaLeadId,
          clientName: extracted.clientName,
          destinations: extracted.destinations,
        });
      }
    }

    // 6. Update sync timestamp and count
    await updateLastSynced(admin, user.id, newIngestedResults.length);

    return NextResponse.json({
      success: true,
      newLeadsCount: newIngestedResults.length,
      totalMetaLeads: rawMetaLeads.length,
      leads: newIngestedResults,
      message: newIngestedResults.length > 0
        ? `Successfully fetched and ingested ${newIngestedResults.length} new live lead${newIngestedResults.length > 1 ? "s" : ""} from Meta!`
        : `Sync complete: All ${rawMetaLeads.length} leads from this Meta form are already in your CRM.`,
    });
  } catch (err: any) {
    console.error("[whatsapp-meta sync POST]", err);
    return NextResponse.json({ error: err.message || "Failed to sync actual leads" }, { status: 500 });
  }
}

async function updateLastSynced(admin: any, userId: string, countAdd = 0) {
  const nowIso = new Date().toISOString();
  try {
    const { data: current } = await admin
      .from("whatsapp_meta_integrations")
      .select("leads_ingested_count")
      .eq("user_id", userId)
      .maybeSingle();

    const newCount = (current?.leads_ingested_count || 0) + countAdd;

    await admin
      .from("whatsapp_meta_integrations")
      .update({
        last_synced_at: nowIso,
        status: "connected",
        leads_ingested_count: newCount,
      })
      .eq("user_id", userId);
  } catch (e) {
    // ignore
  }
}
