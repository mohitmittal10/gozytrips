import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const supabase = await createServerComponentClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { itineraryId } = body;

        if (!itineraryId) {
            return NextResponse.json({ error: "itineraryId is required" }, { status: 400 });
        }

        // Verify the itinerary belongs to this user
        const { data: itinerary, error: itinError } = await supabase
            .from("itineraries")
            .select("id, user_id, share_token, share_enabled")
            .eq("id", itineraryId)
            .eq("user_id", user.id)
            .single();

        if (itinError || !itinerary) {
            return NextResponse.json({ error: "Itinerary not found or access denied" }, { status: 404 });
        }

        // If a token already exists, just return it (idempotent)
        if (itinerary.share_token && itinerary.share_enabled) {
            return NextResponse.json({
                success: true,
                share_token: itinerary.share_token,
                invoice_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/invoice/${itinerary.share_token}`,
                already_existed: true,
            });
        }

        // Generate a new UUID token via admin client (bypasses RLS for the UPDATE)
        const { data: updated, error: updateError } = await supabaseAdmin
            .from("itineraries")
            .update({
                share_token: crypto.randomUUID(),
                share_enabled: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", itineraryId)
            .eq("user_id", user.id)
            .select("share_token")
            .single();

        if (updateError || !updated) {
            console.error("Failed to generate itinerary invoice token:", updateError);
            return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            share_token: updated.share_token,
            invoice_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/invoice/${updated.share_token}`,
            already_existed: false,
        });
    } catch (err) {
        console.error("Itinerary invoice generation error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
