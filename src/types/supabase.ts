export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          company_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          website: string | null;
          brand_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          company_name?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          website?: string | null;
          brand_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          company_name?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          website?: string | null;
          brand_color?: string | null;
          updated_at?: string;
        };
      };
      itineraries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          starting_location: string;
          ending_location: string | null;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          destinations: string;
          budget: number | null;
          walking_distance: number | null;
          must_include: string | null;
          avoid: string | null;
          itinerary_data: Record<string, any>;
          client_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          starting_location: string;
          ending_location?: string | null;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          destinations: string;
          budget?: number | null;
          walking_distance?: number | null;
          must_include?: string | null;
          avoid?: string | null;
          itinerary_data: Record<string, any>;
          client_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          client_id?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
    };
  };
};
