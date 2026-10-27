import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/integrations/whatsapp-meta/meta-resources
// Dynamically queries Meta Graph API to fetch user's real Pages and real Lead Generation Forms
export async function POST(req: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let token = body.accessToken?.trim();
    const pageId = body.pageId?.trim();
    const phoneNumberId = body.phoneNumberId?.trim();

    // If no token provided in request, check if user already has one saved in DB
    if (!token || token.includes("...")) {
      const admin = createAdminClient();
      const { data: integration } = await (admin as any)
        .from("whatsapp_meta_integrations")
        .select("meta_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

      if (integration?.meta_access_token) {
        token = integration.meta_access_token;
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Meta Access Token is required to discover your Facebook Pages and Lead Forms." },
        { status: 400 }
      );
    }

    // 1. Validate token with Meta /me endpoint
    const meRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
    const meData = await meRes.json();

    if (meData.error) {
      return NextResponse.json(
        {
          error: `Meta API Error: ${meData.error.message || "Invalid Access Token"}`,
          code: meData.error.code,
        },
        { status: 400 }
      );
    }

    // 2. If a specific pageId is provided, fetch its real LeadGen forms
    if (pageId) {
      const formsRes = await fetch(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/leadgen_forms?fields=id,name,status,leads_count,created_time,locale&access_token=${encodeURIComponent(token)}`
      );
      const formsData = await formsRes.json();

      if (formsData.error) {
        return NextResponse.json(
          { error: `Failed to load forms: ${formsData.error.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        user: meData,
        forms: (formsData.data || []).map((f: any) => ({
          id: f.id,
          name: f.name || "Untitled Lead Form",
          status: f.status || "ACTIVE",
          leadsCount: f.leads_count ?? 0,
          createdTime: f.created_time,
        })),
      });
    }

    // 3. Otherwise, fetch all Facebook Pages the token has access to
    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,category,access_token,tasks&access_token=${encodeURIComponent(token)}`
    );
    const pagesData = await pagesRes.json();

    const pages = (pagesData.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pageAccessToken: p.access_token,
    }));

    // If there's at least one page, also fetch its forms upfront
    let forms: any[] = [];
    if (pages.length > 0) {
      const firstPage = pages[0];
      const pageToken = firstPage.pageAccessToken || token;
      try {
        const formsRes = await fetch(
          `https://graph.facebook.com/v20.0/${firstPage.id}/leadgen_forms?fields=id,name,status,leads_count,created_time&access_token=${encodeURIComponent(pageToken)}`
        );
        const formsData = await formsRes.json();
        if (Array.isArray(formsData.data)) {
          forms = formsData.data.map((f: any) => ({
            id: f.id,
            name: f.name || "Untitled Lead Form",
            status: f.status || "ACTIVE",
            leadsCount: f.leads_count ?? 0,
            createdTime: f.created_time,
          }));
        }
      } catch (err) {
        console.warn("Could not pre-fetch forms for page:", err);
      }
    }

    // 4. Optionally verify WhatsApp Phone Number if provided
    let whatsappInfo: any = null;
    if (phoneNumberId) {
      try {
        const waRes = await fetch(
          `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}?fields=id,verified_name,display_phone_number,quality_rating,code_verification_status&access_token=${encodeURIComponent(token)}`
        );
        const waData = await waRes.json();
        if (!waData.error) {
          whatsappInfo = {
            verifiedName: waData.verified_name,
            displayPhoneNumber: waData.display_phone_number,
            qualityRating: waData.quality_rating,
          };
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      user: meData,
      pages,
      forms,
      whatsapp: whatsappInfo,
    });
  } catch (err: any) {
    console.error("[meta-resources error]", err);
    return NextResponse.json({ error: err.message || "Failed to query Meta resources" }, { status: 500 });
  }
}
