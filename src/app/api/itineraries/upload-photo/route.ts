import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const BUCKET = "itinerary-photos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Authenticate via user session cookie
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    // 3. Build a unique path scoped to this user
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const filePath = `${user.id}/${timestamp}-${randomId}.${ext}`;

    // 4. Upload via service-role admin client (bypasses RLS)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error("[upload-photo] Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 5. Return the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    console.error("[upload-photo] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
