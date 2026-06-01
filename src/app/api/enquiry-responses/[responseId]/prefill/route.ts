import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

// GET /api/enquiry-responses/[responseId]/prefill
// Agent-authenticated route that fetches a single response for The Lab pre-fill.
// The form ID is unknown at this point (we only have the responseId from the URL),
// so we join through the form to verify agent ownership.
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

    // Fetch the response and verify ownership via form join
    const { data: response, error } = await (supabase as any)
      .from("client_enquiry_responses")
      .select(`
        *,
        client_enquiry_forms!inner(user_id)
      `)
      .eq("id", responseId)
      .eq("client_enquiry_forms.user_id", user.id)
      .maybeSingle();

    if (error || !response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Strip the joined form data before returning
    const { client_enquiry_forms: _form, ...responseData } = response as any;

    return NextResponse.json({ response: responseData });
  } catch (err: any) {
    console.error("[prefill GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
