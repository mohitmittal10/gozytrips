import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/input-sanitizer";
import type { CreateEnquiryFormPayload } from "@/types/enquiry";

// GET /api/enquiry-forms — list all forms for the authenticated agent
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await (supabase as any)
      .from("client_enquiry_forms")
      .select(`
        id, title, description, share_token, status, expires_at, created_at, updated_at, client_id,
        clients(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Attach response counts
    const formIds = (data || []).map((f: any) => f.id);
    let countMap: Record<string, number> = {};

    if (formIds.length > 0) {
      const { data: counts } = await (supabase as any)
        .from("client_enquiry_responses")
        .select("form_id")
        .in("form_id", formIds)
        .neq("status", "archived");

      for (const row of counts || []) {
        countMap[row.form_id] = (countMap[row.form_id] || 0) + 1;
      }
    }

    const forms = (data || []).map((f: any) => ({
      ...f,
      client_name: f.clients?.name ?? null,
      clients: undefined,
      response_count: countMap[f.id] || 0,
    }));

    return NextResponse.json({ forms });
  } catch (err: any) {
    console.error("[enquiry-forms GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/enquiry-forms — create a new enquiry form
export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateEnquiryFormPayload = await request.json();

    // Validate title
    const title = sanitizeText(body.title, 200);
    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: "Title is required (min 2 characters)" }, { status: 400 });
    }

    // If client_id provided, verify it belongs to this agent
    if (body.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("id", body.client_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    const admin = createAdminClient();
    const { data: form, error: insertError } = await (admin as any)
      .from("client_enquiry_forms")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: body.description ? sanitizeText(body.description, 500) : null,
        client_id: body.client_id || null,
        expires_at: body.expires_at || null,
        status: body.status || "active",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ form }, { status: 201 });
  } catch (err: any) {
    console.error("[enquiry-forms POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
