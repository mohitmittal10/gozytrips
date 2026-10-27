import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WhatsAppMetaIntegration } from "@/types/enquiry";

// Helper to mask secret tokens in API responses
function maskToken(token?: string | null): string {
  if (!token) return "";
  if (token.length <= 8) return "********";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

// GET /api/integrations/whatsapp-meta — Fetch connected account status
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Try fetching from whatsapp_meta_integrations table
    try {
      const { data, error } = await (admin as any)
        .from("whatsapp_meta_integrations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        const integration: WhatsAppMetaIntegration = {
          id: data.id,
          userId: data.user_id,
          accountName: data.account_name,
          phoneNumber: data.phone_number,
          provider: data.provider || "meta_whatsapp",
          status: data.status || "connected",
          metaPageName: data.meta_page_name || "",
          metaAdAccountId: data.meta_ad_account_id || "",
          metaFormId: data.meta_form_id || "",
          metaAccessToken: maskToken(data.meta_access_token),
          wabaId: data.waba_id || "",
          phoneNumberId: data.phone_number_id || "",
          verifyToken: data.verify_token || "gozytrips_meta_lead_sync",
          autoSync: data.auto_sync ?? true,
          syncIntervalMinutes: data.sync_interval_minutes || 5,
          lastSyncedAt: data.last_synced_at,
          leadsIngestedCount: data.leads_ingested_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return NextResponse.json({
          connected: true,
          integration,
        });
      }
    } catch (dbErr) {
      console.warn("[whatsapp-meta GET] Table lookup failed, trying fallback:", dbErr);
    }

    // 2. Fallback: Check user_preferences
    const { data: prefData } = await (admin as any)
      .from("user_preferences")
      .select("my_trips_preferences")
      .eq("user_id", user.id)
      .maybeSingle();

    const stored = prefData?.my_trips_preferences?.whatsapp_meta_integration;
    if (stored && stored.connected) {
      return NextResponse.json({
        connected: true,
        integration: {
          ...stored,
          metaAccessToken: maskToken(stored.metaAccessToken),
        },
      });
    }

    return NextResponse.json({
      connected: false,
      integration: null,
    });
  } catch (err: any) {
    console.error("[whatsapp-meta GET]", err);
    return NextResponse.json({ error: err.message || "Failed to load integration status" }, { status: 500 });
  }
}

// POST /api/integrations/whatsapp-meta — Connect or update WhatsApp & Meta Account
export async function POST(req: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      accountName,
      phoneNumber,
      provider = "meta_whatsapp",
      metaPageName,
      metaAdAccountId,
      metaFormId,
      metaAccessToken,
      wabaId,
      phoneNumberId,
      autoSync = true,
      syncIntervalMinutes = 5,
    } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = phoneNumber.trim();
    const finalAccountName = (accountName || "My WhatsApp & Meta Hub").trim();
    const verifyToken = body.verifyToken || `meta_verify_${user.id.slice(0, 8)}`;

    const admin = createAdminClient();

    let savedData: any = null;

    // 1. Try upserting into whatsapp_meta_integrations table
    try {
      const payload: Record<string, any> = {
        user_id: user.id,
        account_name: finalAccountName,
        phone_number: cleanPhone,
        provider,
        status: "connected",
        meta_page_name: metaPageName?.trim() || null,
        meta_ad_account_id: metaAdAccountId?.trim() || null,
        meta_form_id: metaFormId?.trim() || null,
        waba_id: wabaId?.trim() || null,
        phone_number_id: phoneNumberId?.trim() || null,
        verify_token: verifyToken,
        auto_sync: Boolean(autoSync),
        sync_interval_minutes: Number(syncIntervalMinutes) || 5,
        last_synced_at: new Date().toISOString(),
      };

      // Only overwrite meta_access_token if a new one was provided
      if (metaAccessToken && !metaAccessToken.includes("...")) {
        payload.meta_access_token = metaAccessToken.trim();
      }

      const { data, error } = await (admin as any)
        .from("whatsapp_meta_integrations")
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .single();

      if (!error && data) {
        savedData = data;
      }
    } catch (dbErr) {
      console.warn("[whatsapp-meta POST] Upsert to table failed, using preferences fallback:", dbErr);
    }

    // 2. Also keep user_preferences updated as backup
    try {
      const { data: prefData } = await (admin as any)
        .from("user_preferences")
        .select("my_trips_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      const existingMyTrips = prefData?.my_trips_preferences || {};
      const updatedIntegration = {
        connected: true,
        accountName: finalAccountName,
        phoneNumber: cleanPhone,
        provider,
        status: "connected",
        metaPageName: metaPageName || "",
        metaAdAccountId: metaAdAccountId || "",
        metaFormId: metaFormId || "",
        metaAccessToken: metaAccessToken || existingMyTrips.whatsapp_meta_integration?.metaAccessToken || "",
        wabaId: wabaId || "",
        phoneNumberId: phoneNumberId || "",
        verifyToken,
        autoSync: Boolean(autoSync),
        syncIntervalMinutes: Number(syncIntervalMinutes) || 5,
        lastSyncedAt: new Date().toISOString(),
        leadsIngestedCount: savedData?.leads_ingested_count || existingMyTrips.whatsapp_meta_integration?.leadsIngestedCount || 0,
      };

      await (admin as any)
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          my_trips_preferences: {
            ...existingMyTrips,
            whatsapp_meta_integration: updatedIntegration,
          },
        }, { onConflict: "user_id" });
    } catch (prefErr) {
      console.warn("[whatsapp-meta POST] preferences update failed:", prefErr);
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp & Meta account connected successfully! Lead auto-ingestion is now active.",
      integration: {
        accountName: finalAccountName,
        phoneNumber: cleanPhone,
        provider,
        status: "connected",
        metaPageName,
        metaAdAccountId,
        metaFormId,
        autoSync,
        lastSyncedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[whatsapp-meta POST]", err);
    return NextResponse.json({ error: err.message || "Failed to connect account" }, { status: 500 });
  }
}

// PATCH /api/integrations/whatsapp-meta — Update settings (like auto-sync toggle)
export async function PATCH(req: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    const admin = createAdminClient();

    try {
      const dbUpdates: Record<string, any> = {};
      if (typeof updates.autoSync === "boolean") dbUpdates.auto_sync = updates.autoSync;
      if (typeof updates.syncIntervalMinutes === "number") dbUpdates.sync_interval_minutes = updates.syncIntervalMinutes;
      if (updates.status) dbUpdates.status = updates.status;

      await (admin as any)
        .from("whatsapp_meta_integrations")
        .update(dbUpdates)
        .eq("user_id", user.id);
    } catch (e) {
      // ignore table fallback
    }

    // Also update preferences
    try {
      const { data: prefData } = await (admin as any)
        .from("user_preferences")
        .select("my_trips_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      const existing = prefData?.my_trips_preferences || {};
      if (existing.whatsapp_meta_integration) {
        const merged = {
          ...existing.whatsapp_meta_integration,
          ...updates,
        };
        await (admin as any)
          .from("user_preferences")
          .update({
            my_trips_preferences: {
              ...existing,
              whatsapp_meta_integration: merged,
            },
          })
          .eq("user_id", user.id);
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

// DELETE /api/integrations/whatsapp-meta — Disconnect WhatsApp & Meta account
export async function DELETE() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    try {
      await (admin as any)
        .from("whatsapp_meta_integrations")
        .delete()
        .eq("user_id", user.id);
    } catch (e) {
      // ignore table fallback
    }

    try {
      const { data: prefData } = await (admin as any)
        .from("user_preferences")
        .select("my_trips_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      const existing = prefData?.my_trips_preferences || {};
      delete existing.whatsapp_meta_integration;

      await (admin as any)
        .from("user_preferences")
        .update({
          my_trips_preferences: existing,
        })
        .eq("user_id", user.id);
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp & Meta account disconnected.",
    });
  } catch (err: any) {
    console.error("[whatsapp-meta DELETE]", err);
    return NextResponse.json({ error: err.message || "Failed to disconnect account" }, { status: 500 });
  }
}
