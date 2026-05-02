export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agency_settings: {
        Row: {
          agent_signature: string | null
          bank_details: string | null
          brand_name: string | null
          created_at: string
          default_booking_currency: string | null
          default_bus_departure_time: string | null
          default_bus_reporting_time: string | null
          default_bus_type: string | null
          default_cab_vehicle_type: string | null
          default_commission_rate: number | null
          default_currency: string | null
          default_hotel_check_in: string | null
          default_hotel_check_out: string | null
          default_hotel_star_rating: number | null
          default_markup_type: string | null
          default_markup_value: number | null
          default_meal_plan: string | null
          default_pdf_filename_template: string | null
          default_tax_percentage: number | null
          email_body_limit: number | null
          email_subject_limit: number | null
          gst_number: string | null
          id: string
          terms_conditions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_signature?: string | null
          bank_details?: string | null
          brand_name?: string | null
          created_at?: string
          default_booking_currency?: string | null
          default_bus_departure_time?: string | null
          default_bus_reporting_time?: string | null
          default_bus_type?: string | null
          default_cab_vehicle_type?: string | null
          default_commission_rate?: number | null
          default_currency?: string | null
          default_hotel_check_in?: string | null
          default_hotel_check_out?: string | null
          default_hotel_star_rating?: number | null
          default_markup_type?: string | null
          default_markup_value?: number | null
          default_meal_plan?: string | null
          default_pdf_filename_template?: string | null
          default_tax_percentage?: number | null
          email_body_limit?: number | null
          email_subject_limit?: number | null
          gst_number?: string | null
          id?: string
          terms_conditions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_signature?: string | null
          bank_details?: string | null
          brand_name?: string | null
          created_at?: string
          default_booking_currency?: string | null
          default_bus_departure_time?: string | null
          default_bus_reporting_time?: string | null
          default_bus_type?: string | null
          default_cab_vehicle_type?: string | null
          default_commission_rate?: number | null
          default_currency?: string | null
          default_hotel_check_in?: string | null
          default_hotel_check_out?: string | null
          default_hotel_star_rating?: number | null
          default_markup_type?: string | null
          default_markup_value?: number | null
          default_meal_plan?: string | null
          default_pdf_filename_template?: string | null
          default_tax_percentage?: number | null
          email_body_limit?: number | null
          email_subject_limit?: number | null
          gst_number?: string | null
          id?: string
          terms_conditions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          adult_pax: number | null
          avoid: string | null
          budget: number | null
          child_pax: number | null
          client_id: string | null
          client_price: number | null
          commission_amount: number | null
          commission_rate: number | null
          costing_type: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          destinations: string | null
          draft_source_itinerary_id: string | null
          end_date: string
          end_time: string | null
          ending_location: string | null
          expected_value: number | null
          generation_preferences: Json | null
          id: string
          infant_pax: number | null
          is_favourite: boolean | null
          itinerary_data: Json
          last_activity_at: string
          loss_reason: string | null
          markup_type: string | null
          markup_value: number | null
          must_include: string | null
          optimization_count: number
          pdf_overrides: Json | null
          selected_theme: string | null
          share_enabled: boolean | null
          share_token: string | null
          show_prices: boolean
          show_timestamps: boolean
          start_date: string
          start_time: string | null
          starting_location: string
          status: string
          tax_percentage: number | null
          title: string
          trip_id: string | null
          updated_at: string | null
          updated_financial_at: string | null
          user_id: string
          walking_distance: number | null
        }
        Insert: {
          adult_pax?: number | null
          avoid?: string | null
          budget?: number | null
          child_pax?: number | null
          client_id?: string | null
          client_price?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          costing_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          destinations?: string | null
          draft_source_itinerary_id?: string | null
          end_date: string
          end_time?: string | null
          ending_location?: string | null
          expected_value?: number | null
          generation_preferences?: Json | null
          id?: string
          infant_pax?: number | null
          is_favourite?: boolean | null
          itinerary_data: Json
          last_activity_at?: string
          loss_reason?: string | null
          markup_type?: string | null
          markup_value?: number | null
          must_include?: string | null
          optimization_count?: number
          pdf_overrides?: Json | null
          selected_theme?: string | null
          share_enabled?: boolean | null
          share_token?: string | null
          show_prices?: boolean
          show_timestamps?: boolean
          start_date: string
          start_time?: string | null
          starting_location: string
          status?: string
          tax_percentage?: number | null
          title: string
          trip_id?: string | null
          updated_at?: string | null
          updated_financial_at?: string | null
          user_id: string
          walking_distance?: number | null
        }
        Update: {
          adult_pax?: number | null
          avoid?: string | null
          budget?: number | null
          child_pax?: number | null
          client_id?: string | null
          client_price?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          costing_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          destinations?: string | null
          draft_source_itinerary_id?: string | null
          end_date?: string
          end_time?: string | null
          ending_location?: string | null
          expected_value?: number | null
          generation_preferences?: Json | null
          id?: string
          infant_pax?: number | null
          is_favourite?: boolean | null
          itinerary_data?: Json
          last_activity_at?: string
          loss_reason?: string | null
          markup_type?: string | null
          markup_value?: number | null
          must_include?: string | null
          optimization_count?: number
          pdf_overrides?: Json | null
          selected_theme?: string | null
          share_enabled?: boolean | null
          share_token?: string | null
          show_prices?: boolean
          show_timestamps?: boolean
          start_date?: string
          start_time?: string | null
          starting_location?: string
          status?: string
          tax_percentage?: number | null
          title?: string
          trip_id?: string | null
          updated_at?: string | null
          updated_financial_at?: string | null
          user_id?: string
          walking_distance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_draft_source_itinerary_id_fkey"
            columns: ["draft_source_itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_status_events: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          from_status: string | null
          id: string
          itinerary_id: string
          notes: string | null
          to_status: string
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          from_status?: string | null
          id?: string
          itinerary_id: string
          notes?: string | null
          to_status: string
          user_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          from_status?: string | null
          id?: string
          itinerary_id?: string
          notes?: string | null
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_status_events_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_options: {
        Row: {
          id: string
          is_active: boolean | null
          label: string
          metadata: Json | null
          scope: string
          sort_order: number | null
          updated_at: string | null
          user_id: string | null
          value: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          label: string
          metadata?: Json | null
          scope: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
          value: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          label?: string
          metadata?: Json | null
          scope?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
          value?: string
        }
        Relationships: []
      }
      standalone_bookings: {
        Row: {
          booking_details: Json
          client_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          markup_percentage: number | null
          net_cost: number | null
          service_type: Database["public"]["Enums"]["booking_service_type"]
          status: Database["public"]["Enums"]["booking_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_details?: Json
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          markup_percentage?: number | null
          net_cost?: number | null
          service_type: Database["public"]["Enums"]["booking_service_type"]
          status?: Database["public"]["Enums"]["booking_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_details?: Json
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          markup_percentage?: number | null
          net_cost?: number | null
          service_type?: Database["public"]["Enums"]["booking_service_type"]
          status?: Database["public"]["Enums"]["booking_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "standalone_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_paid: boolean
          itinerary_id: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_paid?: boolean
          itinerary_id: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_paid?: boolean
          itinerary_id?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_line_items: {
        Row: {
          category: string
          created_at: string
          currency: string
          id: string
          itinerary_id: string
          markup_percentage: number
          net_cost: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string
          id?: string
          itinerary_id: string
          markup_percentage?: number
          net_cost?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          id?: string
          itinerary_id?: string
          markup_percentage?: number
          net_cost?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_line_items_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          itinerary_id: string
          method: string
          notes: string | null
          reference: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          itinerary_id: string
          method?: string
          notes?: string | null
          reference?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          itinerary_id?: string
          method?: string
          notes?: string | null
          reference?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_payments_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_form_drafts: {
        Row: {
          data: Json
          form_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          form_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          form_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          backup_prompt_dismissed: boolean | null
          crm_filter_presets: Json | null
          crm_filters: Json | null
          crm_last_viewed_activity_at: string | null
          crm_sort: Json | null
          crm_visible_columns: Json | null
          default_pdf_theme: string | null
          my_trips_preferences: Json | null
          pdf_preview_zoom: number | null
          pending_import_backup: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_prompt_dismissed?: boolean | null
          crm_filter_presets?: Json | null
          crm_filters?: Json | null
          crm_last_viewed_activity_at?: string | null
          crm_sort?: Json | null
          crm_visible_columns?: Json | null
          default_pdf_theme?: string | null
          my_trips_preferences?: Json | null
          pdf_preview_zoom?: number | null
          pending_import_backup?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_prompt_dismissed?: boolean | null
          crm_filter_presets?: Json | null
          crm_filters?: Json | null
          crm_last_viewed_activity_at?: string | null
          crm_sort?: Json | null
          crm_visible_columns?: Json | null
          default_pdf_theme?: string | null
          my_trips_preferences?: Json | null
          pdf_preview_zoom?: number | null
          pending_import_backup?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          backup_frequency: string | null
          bio: string | null
          brand_color: string | null
          business_email: string | null
          business_phone: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          google_drive_folder_id: string | null
          google_refresh_token: string | null
          id: string
          last_backup_date: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          backup_frequency?: string | null
          bio?: string | null
          brand_color?: string | null
          business_email?: string | null
          business_phone?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          google_drive_folder_id?: string | null
          google_refresh_token?: string | null
          id: string
          last_backup_date?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          backup_frequency?: string | null
          bio?: string | null
          brand_color?: string | null
          business_email?: string | null
          business_phone?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          google_drive_folder_id?: string | null
          google_refresh_token?: string | null
          id?: string
          last_backup_date?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      vendor_enquiries: {
        Row: {
          body: string | null
          client_id: string | null
          created_at: string
          enquiry_type: string
          id: string
          itinerary_id: string | null
          payload: Json
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
          vendor_email: string | null
        }
        Insert: {
          body?: string | null
          client_id?: string | null
          created_at?: string
          enquiry_type: string
          id?: string
          itinerary_id?: string | null
          payload: Json
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
          vendor_email?: string | null
        }
        Update: {
          body?: string | null
          client_id?: string | null
          created_at?: string
          enquiry_type?: string
          id?: string
          itinerary_id?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
          vendor_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_enquiries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_enquiries_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_trip_id: { Args: never; Returns: string }
    }
    Enums: {
      booking_service_type: "flight" | "cab" | "bus" | "train" | "hotel"
      booking_status: "draft" | "quoted" | "confirmed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_service_type: ["flight", "cab", "bus", "train", "hotel"],
      booking_status: ["draft", "quoted", "confirmed", "cancelled"],
    },
  },
} as const
