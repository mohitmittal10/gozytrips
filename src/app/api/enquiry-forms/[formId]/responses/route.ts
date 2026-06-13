import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/input-sanitizer";
import type { SubmitEnquiryResponsePayload } from "@/types/enquiry";

const VALID_TRIP_TYPES = ["adventurous","scenic","relaxed","cultural","romantic","family","foodie"];
const VALID_TRAVEL_TIMES = ["no_preference","avoid_night_travel","prefer_morning_travel","prefer_afternoon_travel","prefer_night_travel"];
const VALID_METHODS = ["Flight","Train","Bus","Cab","Ferry"];

// GET /api/enquiry-forms/[formId]/responses — list responses for a form (agent only)
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

    let responses;
    if (formId === "all") {
      const { data, error } = await (supabase as any)
        .from("client_enquiry_responses")
        .select("*, client_enquiry_forms!inner(user_id)")
        .eq("client_enquiry_forms.user_id", user.id)
        .neq("status", "archived")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      responses = data;
    } else {
      // Verify the form belongs to this agent
      const { data: form } = await (supabase as any)
        .from("client_enquiry_forms")
        .select("id")
        .eq("id", formId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!form) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      const { data, error } = await (supabase as any)
        .from("client_enquiry_responses")
        .select("*")
        .eq("form_id", formId)
        .neq("status", "archived")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      responses = data;
    }

    // Auto-mark unread responses as "viewed"
    const pendingIds = (responses || [])
      .filter((r: any) => r.status === "pending")
      .map((r: any) => r.id);

    if (pendingIds.length > 0) {
      const admin = createAdminClient();
      await (admin as any)
        .from("client_enquiry_responses")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .in("id", pendingIds);
    }

    return NextResponse.json({ responses: responses || [] });
  } catch (err: any) {
    console.error("[responses GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/enquiry-forms/[formId]/responses — submit a response (public, client auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const supabase = await createServerComponentClient();

    // Client must be authenticated (lightweight Supabase account - Option B)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to submit this form." }, { status: 401 });
    }

    // Verify the form is active and belongs to the right share context
    const admin = createAdminClient();
    const { data: form, error: formError } = await (admin as any)
      .from("client_enquiry_forms")
      .select("id, user_id, status, expires_at")
      .eq("id", formId)
      .maybeSingle();

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }
    if (form.status !== "active") {
      return NextResponse.json({ error: "This form is no longer accepting responses." }, { status: 410 });
    }
    if (form.expires_at && new Date(form.expires_at) < new Date()) {
      return NextResponse.json({ error: "This form has expired." }, { status: 410 });
    }

    // Rate limit: 3 submissions per user per 24h
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count: recentCount } = await (admin as any)
      .from("client_enquiry_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", formId)
      .eq("client_user_id", user.id)
      .gte("submitted_at", oneDayAgo);

    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json({ error: "You have already submitted this form. Please contact the agent for help." }, { status: 429 });
    }

    const body: SubmitEnquiryResponsePayload = await request.json();

    // Validate required fields
    if (!body.client_email || !body.client_email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!body.destinations || body.destinations.trim().length < 2) {
      return NextResponse.json({ error: "Please enter at least one destination." }, { status: 400 });
    }
    if (!body.starting_location || body.starting_location.trim().length < 2) {
      return NextResponse.json({ error: "Starting location is required." }, { status: 400 });
    }
    if (!body.start_date || !body.end_date) {
      return NextResponse.json({ error: "Travel dates are required." }, { status: 400 });
    }
    if (new Date(body.end_date) <= new Date(body.start_date)) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }

    // Check if client already exists by email for this agent
    let resolvedClientId = null;
    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("email", body.client_email.trim().toLowerCase())
      .eq("user_id", form.user_id)
      .maybeSingle();

    if (existingClient) {
      resolvedClientId = existingClient.id;
    } else {
      // Auto-create client in the agents client database
      const clientName = body.client_name ? sanitizeText(body.client_name, 100) : (body.client_email.trim().split("@")[0] || "Unnamed Client");
      const { data: newClient, error: clientCreateError } = await admin
        .from("clients")
        .insert([{
          name: clientName,
          email: body.client_email.trim().toLowerCase(),
          user_id: form.user_id
        }])
        .select("id")
        .single();

      if (clientCreateError) {
        console.error("Failed to auto-create client on form submission:", clientCreateError);
      } else if (newClient) {
        resolvedClientId = newClient.id;
      }
    }

    // Sanitize & validate all text
    const sanitized = {
      client_user_id: user.id,
      client_id: resolvedClientId,
      client_email: body.client_email.trim().toLowerCase(),
      client_name: body.client_name ? sanitizeText(body.client_name, 100) : null,
      form_id: formId,
      status: "pending" as const,
      // Itinerary fields
      starting_location: sanitizeText(body.starting_location, 100),
      destinations: sanitizeText(body.destinations, 300),
      ending_location: body.ending_location ? sanitizeText(body.ending_location, 100) : null,
      start_date: body.start_date,
      end_date: body.end_date,
      adult_pax: Math.max(0, Math.min(99, Number(body.adult_pax) || 1)),
      child_pax: Math.max(0, Math.min(99, Number(body.child_pax) || 0)),
      infant_pax: Math.max(0, Math.min(99, Number(body.infant_pax) || 0)),
      trip_type: VALID_TRIP_TYPES.includes(body.trip_type || "") ? body.trip_type : null,
      travel_methods: (body.travel_methods || []).filter((m) => VALID_METHODS.includes(m)),
      must_include: body.must_include ? sanitizeText(body.must_include, 500) : null,
      avoid: body.avoid ? sanitizeText(body.avoid, 500) : null,
      leisure_time: Boolean(body.leisure_time),
      leisure_day: body.leisure_day ? Math.max(1, Math.min(30, Number(body.leisure_day))) : null,
      travel_time_preference: VALID_TRAVEL_TIMES.includes(body.travel_time_preference || "")
        ? body.travel_time_preference : "no_preference",
      budget: body.budget ? Math.max(0, Number(body.budget)) : null,
      currency: body.currency || "INR",
      special_requests: body.special_requests ? sanitizeText(body.special_requests, 1000) : null,
      raw_payload: body as unknown as Record<string, unknown>,
    };

    const { data: response, error: insertError } = await (admin as any)
      .from("client_enquiry_responses")
      .insert(sanitized)
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ response_id: response.id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error("[responses POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
