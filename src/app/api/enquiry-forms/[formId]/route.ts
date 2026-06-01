import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/input-sanitizer";

// GET /api/enquiry-forms/[formId] — get single form (agent auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: form, error } = await (supabase as any)
      .from("client_enquiry_forms")
      .select("*, clients(name)")
      .eq("id", formId)
      .eq("user_id", user.id)
      .single();

    if (error || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({
      form: {
        ...form,
        client_name: (form as any).clients?.name ?? null,
        clients: undefined,
      }
    });
  } catch (err: any) {
    console.error("[enquiry-forms/[formId] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/enquiry-forms/[formId] — update form
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.title !== undefined) {
      const title = sanitizeText(body.title, 200);
      if (!title || title.trim().length < 2) {
        return NextResponse.json({ error: "Title must be at least 2 characters" }, { status: 400 });
      }
      updates.title = title.trim();
    }
    if (body.description !== undefined) {
      updates.description = body.description ? sanitizeText(body.description, 500) : null;
    }
    if (body.status !== undefined) {
      const allowed = ["draft", "active", "expired", "archived"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.expires_at !== undefined) {
      updates.expires_at = body.expires_at || null;
    }
    if (body.client_id !== undefined) {
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
      updates.client_id = body.client_id || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: form, error: updateError } = await (admin as any)
      .from("client_enquiry_forms")
      .update(updates)
      .eq("id", formId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !form) {
      return NextResponse.json({ error: "Form not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (err: any) {
    console.error("[enquiry-forms/[formId] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/enquiry-forms/[formId] — soft delete (archive)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error: updateError } = await (admin as any)
      .from("client_enquiry_forms")
      .update({ status: "archived" })
      .eq("id", formId)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[enquiry-forms/[formId] DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
