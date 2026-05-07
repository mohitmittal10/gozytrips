import { createClient } from "@/lib/supabase/client";
import { VendorEnquiry } from "@/types/vendor-enquiry";

const supabase = createClient();

export const vendorEnquiryService = {
  async fetchPastEnquiries(userId: string): Promise<VendorEnquiry[]> {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch past enquiries:", error);
      throw error;
    }

    return data || [];
  },

  async fetchUserItineraries(userId: string) {
    const { data, error } = await supabase
      .from("itineraries")
      .select("id, title")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch itineraries:", error);
      throw error;
    }

    return data || [];
  },

  async saveEnquiry(data: Partial<VendorEnquiry>): Promise<VendorEnquiry> {
    const { id, ...payload } = data;

    if (id) {
      const { data: updated, error } = await supabase
        .from("vendor_enquiries")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Failed to update enquiry:", error.message, error.details, error.hint);
        throw error;
      }
      return updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("vendor_enquiries")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Failed to insert enquiry:", error.message, error.details, error.hint);
        throw error;
      }
      return inserted;
    }
  },

  async deleteEnquiry(enqId: string): Promise<void> {
    const { error } = await supabase
      .from("vendor_enquiries")
      .delete()
      .eq("id", enqId);

    if (error) {
      console.error("Failed to delete enquiry:", error);
      throw error;
    }
  }
};
