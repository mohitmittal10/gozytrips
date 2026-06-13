import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchImagesForTerms } from "@/lib/unsplash";

/**
 * POST /api/enquiry-forms/[formId]/responses/[responseId]/itinerary/photos
 *
 * Accepts { searchTerms: string[], areaNames: string[] } and returns
 * an array of photo URLs fetched via Unsplash (server-side, key never exposed).
 *
 * Access control mirrors the parent itinerary route.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ formId: string; responseId: string }> }
) {
  try {
    const { formId, responseId } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify access
    const { data: response, error: respError } = await (admin as any)
      .from("client_enquiry_responses")
      .select("id, client_user_id, itinerary_visible_to_client, client_enquiry_forms!inner(user_id)")
      .eq("id", responseId)
      .eq("form_id", formId)
      .maybeSingle();

    if (respError || !response) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAgent = (response as any).client_enquiry_forms?.user_id === user.id;
    const isClient = response.client_user_id === user.id;

    if (!isAgent && !isClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isClient && !isAgent && !response.itinerary_visible_to_client) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const searchTerms: string[] = body.searchTerms ?? [];
    const areaNames: string[] = body.areaNames ?? [];

    if (searchTerms.length === 0) {
      return NextResponse.json({ photos: [] });
    }

    // Cap to avoid excessive API calls
    const cappedTerms = searchTerms.slice(0, 30);
    const cappedAreas = areaNames.slice(0, 30);

    const photos = await fetchImagesForTerms(cappedTerms, cappedAreas);
    return NextResponse.json({ photos });
  } catch (err: any) {
    console.error("[POST itinerary/photos]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
