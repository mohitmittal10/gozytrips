import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function requireAppUrl(): string {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (!base) {
        throw new Error("NEXT_PUBLIC_APP_URL is not configured");
    }
    return base;
}

export async function POST(request: Request) {
    try {
        const supabase = await createServerComponentClient();
        const supabaseAdmin = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let appUrl: string;
        try {
            appUrl = requireAppUrl();
        } catch {
            return NextResponse.json(
                { error: "Server misconfigured: NEXT_PUBLIC_APP_URL is required" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { itineraryId } = body;

        if (!itineraryId) {
            return NextResponse.json({ error: "itineraryId is required" }, { status: 400 });
        }

        const { data: itinerary, error: itinError } = await supabase
            .from("itineraries")
            .select("id, user_id, share_token, share_enabled")
            .eq("id", itineraryId)
            .eq("user_id", user.id)
            .single();

        if (itinError || !itinerary) {
            return NextResponse.json({ error: "Itinerary not found or access denied" }, { status: 404 });
        }

        if (itinerary.share_token && itinerary.share_enabled) {
            return NextResponse.json({
                success: true,
                share_token: itinerary.share_token,
                invoice_url: `${appUrl}/invoice/${itinerary.share_token}`,
                already_existed: true,
            });
        }

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
            console.error("Failed to generate itinerary invoice token");
            return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            share_token: updated.share_token,
            invoice_url: `${appUrl}/invoice/${updated.share_token}`,
            already_existed: false,
        });
    } catch {
        console.error("Itinerary invoice generation error");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
