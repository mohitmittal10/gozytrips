import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/messages/[responseId] — fetch all messages (agent or client auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is either the agent (owns the form) or the client (owns the response)
    const { data: access } = await (supabase as any)
      .from("client_enquiry_responses")
      .select("id, client_user_id, form_id, client_enquiry_forms!inner(user_id)")
      .eq("id", responseId)
      .maybeSingle();

    if (!access) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const isAgent = (access as any).client_enquiry_forms?.user_id === user.id;
    const isClient = access.client_user_id === user.id;

    if (!isAgent && !isClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: messages, error } = await (supabase as any)
      .from("client_messages")
      .select("*")
      .eq("response_id", responseId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Mark unread messages as read (messages sent by the OTHER party)
    const senderRole = isAgent ? "client" : "agent";
    const unreadIds = (messages || [])
      .filter((m: any) => !m.is_read && m.sender_role === senderRole)
      .map((m: any) => m.id);

    if (unreadIds.length > 0) {
      const admin = createAdminClient();
      await (admin as any)
        .from("client_messages")
        .update({ is_read: true })
        .in("id", unreadIds);
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    console.error("[messages GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages/[responseId] — send a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine caller's role and verify access
    const { data: access } = await (supabase as any)
      .from("client_enquiry_responses")
      .select("id, client_user_id, form_id, client_enquiry_forms!inner(user_id)")
      .eq("id", responseId)
      .maybeSingle();

    if (!access) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const isAgent = (access as any).client_enquiry_forms?.user_id === user.id;
    const isClient = access.client_user_id === user.id;

    if (!isAgent && !isClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const senderRole = isAgent ? "agent" : "client";

    const body = await request.json();
    const rawBody = (body.body || "").trim();
    if (!rawBody || rawBody.length < 1) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }
    if (rawBody.length > 4000) {
      return NextResponse.json({ error: "Message too long (max 4000 chars)" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: message, error: insertError } = await (admin as any)
      .from("client_messages")
      .insert({
        response_id: responseId,
        sender_role: senderRole,
        sender_id: user.id,
        body: rawBody,
        is_read: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    console.error("[messages POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/messages/[responseId] — mark messages as read
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller has access
    const { data: access } = await (supabase as any)
      .from("client_enquiry_responses")
      .select("id, client_user_id, form_id, client_enquiry_forms!inner(user_id)")
      .eq("id", responseId)
      .maybeSingle();

    if (!access) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const isAgent = (access as any).client_enquiry_forms?.user_id === user.id;
    const isClient = access.client_user_id === user.id;

    if (!isAgent && !isClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const senderRole = isAgent ? "client" : "agent"; // mark messages sent by the opposite role as read

    const admin = createAdminClient();
    const { error } = await (admin as any)
      .from("client_messages")
      .update({ is_read: true })
      .eq("response_id", responseId)
      .eq("sender_role", senderRole)
      .eq("is_read", false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[messages PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
