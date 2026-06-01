import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/enquiry-forms/public/[shareToken]
// Public endpoint — returns safe form metadata for the client portal page.
// No agent auth required — clients/anon can access this.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    if (!shareToken || shareToken.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch form + agent brand info in one query
    const { data: form, error } = await (admin as any)
      .from("client_enquiry_forms")
      .select(`
        id, title, description, status, expires_at,
        user_id
      `)
      .eq("share_token", shareToken)
      .maybeSingle();

    if (error || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.status !== "active") {
      return NextResponse.json({ error: "This form is no longer active." }, { status: 410 });
    }

    if (form.expires_at && new Date(form.expires_at) < new Date()) {
      return NextResponse.json({ error: "This form has expired." }, { status: 410 });
    }

    // Fetch agent brand info (non-sensitive fields only)
    const { data: agentProfile } = await admin
      .from("user_profiles")
      .select("full_name, company_name, avatar_url")
      .eq("id", form.user_id)
      .maybeSingle();

    const { data: agencySettings } = await admin
      .from("agency_settings")
      .select("brand_name")
      .eq("user_id", form.user_id)
      .maybeSingle();

    // Return only the safe, public subset
    const publicMeta = {
      id: form.id,
      title: form.title,
      description: form.description,
      status: form.status,
      expires_at: form.expires_at,
      agent_brand_name:
        agencySettings?.brand_name ||
        agentProfile?.company_name ||
        agentProfile?.full_name ||
        "Your Travel Agent",
      agent_avatar_url: agentProfile?.avatar_url || null,
    };

    return NextResponse.json(
      { form: publicMeta },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("[enquiry-forms/public GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
