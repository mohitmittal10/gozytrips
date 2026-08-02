// Client-side utility for uploading itinerary activity photos.
// Delegates to /api/itineraries/upload-photo (server route with service-role key)
// so the photo is stored in Supabase Storage and survives page reloads.

export async function uploadItineraryPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/itineraries/upload-photo", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const { url } = await response.json();
  return url;
}
