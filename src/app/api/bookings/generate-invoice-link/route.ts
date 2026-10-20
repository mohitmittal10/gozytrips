import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function resolveAppUrl(request: Request): string {
    const envUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL)?.replace(/\/$/, "");
    if (envUrl) return envUrl;

    const originHeader = request.headers.get("origin");
    if (originHeader) return originHeader.replace(/\/$/, "");

    try {
        const urlOrigin = new URL(request.url).origin;
        if (urlOrigin && urlOrigin !== "null") return urlOrigin.replace(/\/$/, "");
    } catch {
        // Ignore URL parse error
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host) {
        const proto = request.headers.get("x-forwarded-proto") || "http";
        return `${proto}://${host}`.replace(/\/$/, "");
    }

    return "http://localhost:3000";
}

export async function POST(request: Request) {
    try {
        const supabase = await createServerComponentClient();
        const supabaseAdmin = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const appUrl = resolveAppUrl(request);

        const body = await request.json();
        const { bookingId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
        }

        const { data: booking, error: bookingError } = await (supabase as any)
            .from("standalone_bookings")
            .select("id, user_id, share_token, share_enabled")
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: "Booking not found or access denied" }, { status: 404 });
        }

        if (booking.share_token && booking.share_enabled) {
            return NextResponse.json({
                success: true,
                share_token: booking.share_token,
                invoice_url: `${appUrl}/invoice/booking/${booking.share_token}`,
                already_existed: true,
            });
        }

        const { data: updated, error: updateError } = await (supabaseAdmin as any)
            .from("standalone_bookings")
            .update({
                share_token: crypto.randomUUID(),
                share_enabled: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)
            .eq("user_id", user.id)
            .select("share_token")
            .single();

        if (updateError || !updated) {
            console.error("Failed to generate invoice token");
            return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            share_token: updated.share_token,
            invoice_url: `${appUrl}/invoice/booking/${updated.share_token}`,
            already_existed: false,
        });
    } catch {
        console.error("Invoice generation error");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
