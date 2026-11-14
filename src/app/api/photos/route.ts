import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PhotoArchiveItem {
  id: string;
  user_id: string | null;
  url: string;
  title: string | null;
  destination: string | null;
  search_term: string | null;
  source: string;
  metadata?: any;
  created_at: string;
}

/**
 * GET /api/photos
 * Retrieves photos from the user's photo archive / database.
 * Supports query params: ?q=query &destination=city &source=uploaded|generated &limit=50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const destination = searchParams.get("destination")?.trim() || "";
    const source = searchParams.get("source")?.trim() || "";
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "60", 10)), 120);

    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createAdminClient();
    let query = (admin as any)
      .from("photo_archive")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (user?.id) {
      // User's own photos + global/curated entries
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      // Guest: only global curated photos
      query = query.is("user_id", null);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (destination) {
      query = query.ilike("destination", `%${destination}%`);
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,search_term.ilike.%${q}%,destination.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      // If table has not been created yet in Supabase, return graceful empty list
      if (error.code === "PGRST205" || error.message?.includes("photo_archive")) {
        return NextResponse.json({ photos: [], tableReady: false });
      }
      console.error("[GET /api/photos] Query error:", error);
      return NextResponse.json({ photos: [], error: error.message, tableReady: false });
    }

    return NextResponse.json({ photos: data || [], tableReady: true });
  } catch (err: any) {
    console.error("[GET /api/photos] Unexpected error:", err);
    return NextResponse.json({ photos: [], error: err.message, tableReady: false });
  }
}

/**
 * POST /api/photos
 * Saves generated or uploaded photo(s) to the photo archive database.
 * Body can be a single photo object or { photos: [...] }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: You must be logged in to save photos." }, { status: 401 });
    }

    const body = await request.json();
    const rawList = Array.isArray(body)
      ? body
      : Array.isArray(body?.photos)
      ? body.photos
      : [body];

    const validItems = rawList
      .filter((item: any) => item && typeof item.url === "string" && item.url.trim().length > 0)
      .map((item: any) => ({
        user_id: user.id,
        url: item.url.trim(),
        title: item.title?.trim() || item.searchTerm?.trim() || null,
        destination: item.destination?.trim() || null,
        search_term: item.searchTerm?.trim() || item.search_term?.trim() || null,
        source: item.source === "uploaded" ? "uploaded" : "generated",
        metadata: item.metadata || {},
      }));

    if (validItems.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const admin = createAdminClient();
    const { data, error } = await (admin as any)
      .from("photo_archive")
      .upsert(validItems, { onConflict: "user_id,url", ignoreDuplicates: true })
      .select("id, url");

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("photo_archive")) {
        // Table not migrated yet; gracefully ack
        return NextResponse.json({ success: true, count: 0, pendingMigration: true });
      }
      console.error("[POST /api/photos] Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || validItems.length });
  } catch (err: any) {
    console.error("[POST /api/photos] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Failed to save photos" }, { status: 500 });
  }
}
