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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      article_price_history: {
        Row: {
          article_id: string
          change_source: string
          changed_at: string
          changed_by: string | null
          id: string
          new_price: number
          old_price: number
          organization_id: string
        }
        Insert: {
          article_id: string
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price: number
          old_price: number
          organization_id: string
        }
        Update: {
          article_id?: string
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price?: number
          old_price?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_price_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          annual_order_value: number | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price: number
          sku: string | null
          supplier_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          annual_order_value?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price: number
          sku?: string | null
          supplier_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          annual_order_value?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price?: number
          sku?: string | null
          supplier_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_draft_items: {
        Row: {
          article_id: string
          created_at: string
          draft_id: string
          id: string
          quantity: number
        }
        Insert: {
          article_id: string
          created_at?: string
          draft_id: string
          id?: string
          quantity?: number
        }
        Update: {
          article_id?: string
          created_at?: string
          draft_id?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_draft_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_draft_items_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "cart_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_drafts: {
        Row: {
          created_at: string
          delivery_address: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_drafts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          location_id: string | null
          organization_id: string
          postal_code: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          location_id?: string | null
          organization_id: string
          postal_code: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          location_id?: string | null
          organization_id?: string
          postal_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_addresses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_account_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          article_list_format: string
          closing: string
          created_at: string
          design_style: string
          footer_logo_url: string | null
          footer_text: string | null
          greeting: string
          id: string
          introduction: string
          organization_id: string
          show_powered_by: boolean | null
          signature: string
          subject_template: string
          template_type: string
          updated_at: string
        }
        Insert: {
          article_list_format?: string
          closing?: string
          created_at?: string
          design_style?: string
          footer_logo_url?: string | null
          footer_text?: string | null
          greeting?: string
          id?: string
          introduction?: string
          organization_id: string
          show_powered_by?: boolean | null
          signature?: string
          subject_template?: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          article_list_format?: string
          closing?: string
          created_at?: string
          design_style?: string
          footer_logo_url?: string | null
          footer_text?: string | null
          greeting?: string
          id?: string
          introduction?: string
          organization_id?: string
          show_powered_by?: boolean | null
          signature?: string
          subject_template?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          session_id: string
          storage_1: number
          storage_2: number
          total: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          session_id: string
          storage_1?: number
          storage_2?: number
          total?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          session_id?: string
          storage_1?: number
          storage_2?: number
          total?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          short_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          short_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          short_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_order_confirmation: boolean
          email_order_status: boolean
          email_supplier_updates: boolean
          email_weekly_report: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_order_confirmation?: boolean
          email_order_status?: boolean
          email_supplier_updates?: boolean
          email_weekly_report?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_order_confirmation?: boolean
          email_order_status?: boolean
          email_supplier_updates?: boolean
          email_weekly_report?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_confirmation_tokens: {
        Row: {
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          order_id: string
          token: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          order_id: string
          token?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_confirmation_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          article_id: string
          article_name: string
          created_at: string
          id: string
          order_id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          article_id: string
          article_name: string
          created_at?: string
          id?: string
          order_id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Update: {
          article_id?: string
          article_name?: string
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          is_test_order: boolean
          location_id: string | null
          notes: string | null
          order_number: string
          organization_id: string
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_test_order?: boolean
          location_id?: string | null
          notes?: string | null
          order_number: string
          organization_id: string
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_test_order?: boolean
          location_id?: string | null
          notes?: string | null
          order_number?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          advanced_view_enabled: boolean
          created_at: string
          demo_expires_at: string | null
          id: string
          is_demo: boolean | null
          name: string
          subscription_tier: string
          test_email: string | null
          test_mode_enabled: boolean
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          advanced_view_enabled?: boolean
          created_at?: string
          demo_expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          name: string
          subscription_tier?: string
          test_email?: string | null
          test_mode_enabled?: boolean
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          advanced_view_enabled?: boolean
          created_at?: string
          demo_expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          name?: string
          subscription_tier?: string
          test_email?: string | null
          test_mode_enabled?: boolean
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suggested_articles: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          price: number
          reviewed_at: string | null
          reviewed_by: string | null
          sku: string | null
          status: string
          supplier_comment: string | null
          supplier_id: string
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string | null
          status?: string
          supplier_comment?: string | null
          supplier_id: string
          unit?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string | null
          status?: string
          supplier_comment?: string | null
          supplier_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_articles_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_article_changes: {
        Row: {
          article_id: string
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_article_changes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_article_changes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_article_changes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_locations: {
        Row: {
          created_at: string
          customer_number: string | null
          id: string
          is_active: boolean
          location_id: string
          minimum_order_value: number | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_number?: string | null
          id?: string
          is_active?: boolean
          location_id: string
          minimum_order_value?: number | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_number?: string | null
          id?: string
          is_active?: boolean
          location_id?: string
          minimum_order_value?: number | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_locations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portal_drafts: {
        Row: {
          created_at: string
          draft_data: Json
          id: string
          organization_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_data?: Json
          id?: string
          organization_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_data?: Json
          id?: string
          organization_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_portal_drafts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portal_settings: {
        Row: {
          card_description: string
          card_title: string
          created_at: string
          footer_text: string | null
          id: string
          info_text: string | null
          logo_url: string | null
          organization_id: string
          portal_title: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          card_description?: string
          card_title?: string
          created_at?: string
          footer_text?: string | null
          id?: string
          info_text?: string | null
          logo_url?: string | null
          organization_id: string
          portal_title?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          card_description?: string
          card_title?: string
          created_at?: string
          footer_text?: string | null
          id?: string
          info_text?: string | null
          logo_url?: string | null
          organization_id?: string
          portal_title?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portal_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          supplier_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          supplier_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          supplier_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_tokens_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          customer_number: string | null
          email: string
          id: string
          is_active: boolean
          main_category: string | null
          minimum_order_value: number | null
          name: string
          organization_id: string
          phone: string | null
          top_category: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          customer_number?: string | null
          email: string
          id?: string
          is_active?: boolean
          main_category?: string | null
          minimum_order_value?: number | null
          name: string
          organization_id: string
          phone?: string | null
          top_category?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          customer_number?: string | null
          email?: string
          id?: string
          is_active?: boolean
          main_category?: string | null
          minimum_order_value?: number | null
          name?: string
          organization_id?: string
          phone?: string | null
          top_category?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_order_number: { Args: never; Returns: string }
      get_user_organization_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "purchaser" | "viewer"
      order_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "manager", "purchaser", "viewer"],
      order_status: [
        "draft",
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
