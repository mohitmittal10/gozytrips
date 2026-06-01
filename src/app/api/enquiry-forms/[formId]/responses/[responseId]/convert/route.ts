import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/enquiry-forms/[formId]/responses/[responseId]/convert
// Agent converts a client response into a pre-filled itinerary (one-click flow)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ formId: string; responseId: string }> }
) {
  try {
    const { formId, responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify form ownership
    const { data: form } = await (supabase as any)
      .from("client_enquiry_forms")
      .select("id")
      .eq("id", formId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Verify response belongs to this form
    const { data: response } = await (supabase as any)
      .from("client_enquiry_responses")
      .select("id, status")
      .eq("id", responseId)
      .eq("form_id", formId)
      .maybeSingle();

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Mark as converted
    const admin = createAdminClient();
    await (admin as any)
      .from("client_enquiry_responses")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    // Return The Lab redirect URL with enquiry param
    const labUrl = `/the-lab?enquiry=${responseId}`;
    return NextResponse.json({ success: true, redirect_url: labUrl });
  } catch (err: any) {
    console.error("[responses/convert POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
