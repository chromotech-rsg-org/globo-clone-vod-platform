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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auction_items: {
        Row: {
          auction_id: string
          created_at: string
          current_value: number
          description: string | null
          id: string
          image_url: string | null
          initial_value: number
          is_current: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          image_url?: string | null
          initial_value?: number
          is_current?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          image_url?: string | null
          initial_value?: number
          is_current?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_items_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_registrations: {
        Row: {
          approved_by: string | null
          auction_id: string
          client_notes: string | null
          created_at: string
          id: string
          internal_notes: string | null
          next_registration_allowed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          auction_id: string
          client_notes?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          next_registration_allowed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          auction_id?: string
          client_notes?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          next_registration_allowed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_registrations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_registrations_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          auction_type: string
          bid_increment: number
          created_at: string
          current_bid_value: number
          description: string | null
          end_date: string | null
          id: string
          increment_mode: string
          initial_bid_value: number
          is_live: boolean
          max_custom_bid: number | null
          min_custom_bid: number | null
          name: string
          registration_wait_unit: string | null
          registration_wait_value: number | null
          start_date: string | null
          status: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          auction_type?: string
          bid_increment?: number
          created_at?: string
          current_bid_value?: number
          description?: string | null
          end_date?: string | null
          id?: string
          increment_mode?: string
          initial_bid_value?: number
          is_live?: boolean
          max_custom_bid?: number | null
          min_custom_bid?: number | null
          name: string
          registration_wait_unit?: string | null
          registration_wait_value?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          auction_type?: string
          bid_increment?: number
          created_at?: string
          current_bid_value?: number
          description?: string | null
          end_date?: string | null
          id?: string
          increment_mode?: string
          initial_bid_value?: number
          is_live?: boolean
          max_custom_bid?: number | null
          min_custom_bid?: number | null
          name?: string
          registration_wait_unit?: string | null
          registration_wait_value?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          approved_by: string | null
          auction_id: string
          auction_item_id: string
          bid_value: number
          client_notes: string | null
          created_at: string
          id: string
          internal_notes: string | null
          is_winner: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          auction_id: string
          auction_item_id: string
          bid_value: number
          client_notes?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          is_winner?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          auction_id?: string
          auction_item_id?: string
          bid_value?: number
          client_notes?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          is_winner?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_auction_item_id_fkey"
            columns: ["auction_item_id"]
            isOneToOne: false
            referencedRelation: "auction_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          active: boolean | null
          age_rating_background_color: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          order_index: number
          rating: string | null
          section_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          age_rating_background_color?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number
          rating?: string | null
          section_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          age_rating_background_color?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number
          rating?: string | null
          section_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "content_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sections: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          order_index: number
          page: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          order_index?: number
          page: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          order_index?: number
          page?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_percentage: number
          id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_percentage: number
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_percentage?: number
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customizations: {
        Row: {
          active: boolean | null
          created_at: string | null
          element_key: string
          element_type: string
          element_value: string | null
          id: string
          page: string
          section: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          element_key: string
          element_type: string
          element_value?: string | null
          id?: string
          page: string
          section: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          element_key?: string
          element_type?: string
          element_value?: string | null
          id?: string
          page?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          id: string
          name: string
          suspension_package: boolean | null
          unique_package: boolean | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          suspension_package?: boolean | null
          unique_package?: boolean | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          suspension_package?: boolean | null
          unique_package?: boolean | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      plan_packages: {
        Row: {
          created_at: string
          id: string
          package_id: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          benefits: string[] | null
          best_seller: boolean | null
          billing_cycle: string | null
          created_at: string | null
          description: string | null
          free_days: number | null
          id: string
          name: string
          package_id: string | null
          payment_type: string | null
          price: number
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          benefits?: string[] | null
          best_seller?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          free_days?: number | null
          id?: string
          name: string
          package_id?: string | null
          payment_type?: string | null
          price: number
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          benefits?: string[] | null
          best_seller?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          free_days?: number | null
          id?: string
          name?: string
          package_id?: string | null
          payment_type?: string | null
          price?: number
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          modified_by: string
          new_values: Json | null
          old_values: Json | null
          profile_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          modified_by: string
          new_values?: Json | null
          old_values?: Json | null
          profile_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          modified_by?: string
          new_values?: Json | null
          old_values?: Json | null
          profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          plan_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          plan_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          plan_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          plan_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          extra: Json | null
          id: string
          ip_address: string | null
          locale: string | null
          referrer: string | null
          screen_resolution: string | null
          subscription_id: string | null
          terms_version: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          extra?: Json | null
          id?: string
          ip_address?: string | null
          locale?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          subscription_id?: string | null
          terms_version?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          extra?: Json | null
          id?: string
          ip_address?: string | null
          locale?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          subscription_id?: string | null
          terms_version?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptances_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_user_plan: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_role_change_rate_limit: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_count: number
          last_updated: string
          table_name: string
          total_count: number
          user_count: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_active_subscription: {
        Args: { user_uuid: string }
        Returns: {
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: string
        }[]
      }
      health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reopen_registration: {
        Args: { p_auction: string; p_user: string }
        Returns: undefined
      }
      set_bid_winner: {
        Args: { p_bid_id: string }
        Returns: undefined
      }
      user_has_active_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      user_is_registered_for_auction: {
        Args: { auction_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
