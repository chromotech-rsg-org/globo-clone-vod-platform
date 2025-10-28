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
          increment: number | null
          initial_value: number
          is_current: boolean
          name: string
          order_index: number
          status: string
          updated_at: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          image_url?: string | null
          increment?: number | null
          initial_value?: number
          is_current?: boolean
          name: string
          order_index?: number
          status?: string
          updated_at?: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          image_url?: string | null
          increment?: number | null
          initial_value?: number
          is_current?: boolean
          name?: string
          order_index?: number
          status?: string
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
          manually_disabled_at: string | null
          manually_disabled_by: string | null
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
          manually_disabled_at?: string | null
          manually_disabled_by?: string | null
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
          manually_disabled_at?: string | null
          manually_disabled_by?: string | null
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
          allow_pre_bidding: boolean | null
          auction_type: string
          bid_increment: number
          broadcast_enabled: boolean
          created_at: string
          current_bid_value: number
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
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
          allow_pre_bidding?: boolean | null
          auction_type?: string
          bid_increment?: number
          broadcast_enabled?: boolean
          created_at?: string
          current_bid_value?: number
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
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
          allow_pre_bidding?: boolean | null
          auction_type?: string
          bid_increment?: number
          broadcast_enabled?: boolean
          created_at?: string
          current_bid_value?: number
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          approved_by: string | null
          auction_id: string
          auction_item_id: string
          bid_origin: string | null
          bid_value: number
          client_notes: string | null
          created_at: string
          id: string
          internal_notes: string | null
          is_winner: boolean
          lot_status_at_bid: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          auction_id: string
          auction_item_id: string
          bid_origin?: string | null
          bid_value: number
          client_notes?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          is_winner?: boolean
          lot_status_at_bid?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          auction_id?: string
          auction_item_id?: string
          bid_origin?: string | null
          bid_value?: number
          client_notes?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          is_winner?: boolean
          lot_status_at_bid?: string | null
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
      client_bid_limits: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_unlimited: boolean
          max_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_unlimited?: boolean
          max_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_unlimited?: boolean
          max_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          updated_at: string
          uploaded_by: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          updated_at?: string
          uploaded_by: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          updated_at?: string
          uploaded_by?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          active: boolean | null
          age_rating_background_color: string | null
          category: string | null
          created_at: string | null
          id: string
          image_orientation: string | null
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
          image_orientation?: string | null
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
          image_orientation?: string | null
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
      export_history: {
        Row: {
          created_at: string
          file_name: string
          filters: Json | null
          id: string
          record_count: number | null
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          filters?: Json | null
          id?: string
          record_count?: number | null
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          filters?: Json | null
          id?: string
          record_count?: number | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      failed_bid_attempts: {
        Row: {
          attempted_bid_value: number
          auction_id: string
          auction_item_id: string
          created_at: string
          current_limit: number
          id: string
          reason: string
          total_bids_at_attempt: number
          user_id: string
        }
        Insert: {
          attempted_bid_value: number
          auction_id: string
          auction_item_id: string
          created_at?: string
          current_limit: number
          id?: string
          reason?: string
          total_bids_at_attempt: number
          user_id: string
        }
        Update: {
          attempted_bid_value?: number
          auction_id?: string
          auction_item_id?: string
          created_at?: string
          current_limit?: number
          id?: string
          reason?: string
          total_bids_at_attempt?: number
          user_id?: string
        }
        Relationships: []
      }
      integration_jobs: {
        Row: {
          attempts: number
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Json
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number
          payload: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          job_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status_code: number | null
          success: boolean
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
          success?: boolean
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "integration_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          active: boolean
          api_base_url: string
          api_login: string
          api_secret: string
          created_at: string
          id: string
          updated_at: string
          vendor_id: number | null
        }
        Insert: {
          active?: boolean
          api_base_url: string
          api_login: string
          api_secret: string
          created_at?: string
          id?: string
          updated_at?: string
          vendor_id?: number | null
        }
        Update: {
          active?: boolean
          api_base_url?: string
          api_login?: string
          api_secret?: string
          created_at?: string
          id?: string
          updated_at?: string
          vendor_id?: number | null
        }
        Relationships: []
      }
      integration_test_results: {
        Row: {
          api_login: string | null
          created_at: string
          endpoint: string
          id: string
          method: string
          request_payload: Json | null
          response_payload: Json | null
          status_code: number | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          api_login?: string | null
          created_at?: string
          endpoint: string
          id?: string
          method: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          api_login?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          method?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      limit_increase_requests: {
        Row: {
          created_at: string
          current_limit: number
          id: string
          reason: string | null
          requested_limit: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_limit: number
          id?: string
          reason?: string | null
          requested_limit: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_limit?: number
          id?: string
          reason?: string | null
          requested_limit?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      limit_request_responses: {
        Row: {
          auction_id: string | null
          client_notes: string | null
          created_at: string
          id: string
          new_limit: number | null
          request_id: string
          reviewed_at: string
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          auction_id?: string | null
          client_notes?: string | null
          created_at?: string
          id?: string
          new_limit?: number | null
          request_id: string
          reviewed_at?: string
          reviewed_by?: string | null
          status: string
          user_id: string
        }
        Update: {
          auction_id?: string | null
          client_notes?: string | null
          created_at?: string
          id?: string
          new_limit?: number | null
          request_id?: string
          reviewed_at?: string
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "limit_request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "limit_increase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      motv_api_configs: {
        Row: {
          api_base_url: string
          api_login: string
          api_secret: string
          created_at: string
          id: string
          is_active: boolean
          is_production: boolean
          name: string
          updated_at: string
          vendor_id: number | null
        }
        Insert: {
          api_base_url: string
          api_login: string
          api_secret: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_production?: boolean
          name: string
          updated_at?: string
          vendor_id?: number | null
        }
        Update: {
          api_base_url?: string
          api_login?: string
          api_secret?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_production?: boolean
          name?: string
          updated_at?: string
          vendor_id?: number | null
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
          motv_user_id: string | null
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
          motv_user_id?: string | null
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
          motv_user_id?: string | null
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
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
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
      user_notification_reads: {
        Row: {
          created_at: string
          id: string
          notification_id: string
          notification_type: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id: string
          notification_type: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string
          notification_type?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_user_plan: { Args: never; Returns: boolean }
      check_role_change_rate_limit: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          admin_count: number
          last_updated: string
          table_name: string
          total_count: number
          user_count: number
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_dashboard_stats: {
        Args: never
        Returns: {
          active_auctions: number
          documents_count: number
          limit_requests_pending: number
          pending_registrations: number
          total_auctions: number
          total_bids: number
          total_revenue: number
          total_users: number
        }[]
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
      health_check: { Args: never; Returns: Json }
      reopen_registration: {
        Args: { p_auction: string; p_user: string }
        Returns: undefined
      }
      set_bid_winner: { Args: { p_bid_id: string }; Returns: undefined }
      set_bid_winner_and_finalize_lot: {
        Args: { p_bid_id: string }
        Returns: Json
      }
      start_next_lot: {
        Args: { p_auction_id: string; p_lot_id: string }
        Returns: boolean
      }
      update_auction_lot_statuses: {
        Args: { auction_uuid: string }
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
