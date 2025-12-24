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
      article_locations: {
        Row: {
          article_id: string
          created_at: string
          custom_price: number | null
          id: string
          is_active: boolean
          location_id: string
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          custom_price?: number | null
          id?: string
          is_active?: boolean
          location_id: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          custom_price?: number | null
          id?: string
          is_active?: boolean
          location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_locations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      article_price_history: {
        Row: {
          article_id: string
          change_source: string
          changed_at: string
          changed_by: string | null
          id: string
          invoice_id: string | null
          new_price: number
          old_price: number
          order_id: string | null
          organization_id: string
        }
        Insert: {
          article_id: string
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          invoice_id?: string | null
          new_price: number
          old_price: number
          order_id?: string | null
          organization_id: string
        }
        Update: {
          article_id?: string
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          invoice_id?: string | null
          new_price?: number
          old_price?: number
          order_id?: string | null
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
            foreignKeyName: "article_price_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_price_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          description_en: string | null
          description_fr: string | null
          description_th: string | null
          flavor_profile: string | null
          flavor_profile_en: string | null
          flavor_profile_fr: string | null
          flavor_profile_th: string | null
          food_pairings: string | null
          food_pairings_en: string | null
          food_pairings_fr: string | null
          food_pairings_th: string | null
          grape_variety: string | null
          grape_variety_en: string | null
          grape_variety_fr: string | null
          grape_variety_th: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_unit_id: string | null
          organization_id: string
          origin_country: string | null
          origin_country_en: string | null
          origin_country_fr: string | null
          origin_country_th: string | null
          packaging_unit: number | null
          price: number
          reference_price: number | null
          reference_unit: string | null
          selling_price: number | null
          sku: string | null
          sort_order: number
          supplier_id: string
          top_category: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          annual_order_value?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_th?: string | null
          flavor_profile?: string | null
          flavor_profile_en?: string | null
          flavor_profile_fr?: string | null
          flavor_profile_th?: string | null
          food_pairings?: string | null
          food_pairings_en?: string | null
          food_pairings_fr?: string | null
          food_pairings_th?: string | null
          grape_variety?: string | null
          grape_variety_en?: string | null
          grape_variety_fr?: string | null
          grape_variety_th?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_unit_id?: string | null
          organization_id: string
          origin_country?: string | null
          origin_country_en?: string | null
          origin_country_fr?: string | null
          origin_country_th?: string | null
          packaging_unit?: number | null
          price: number
          reference_price?: number | null
          reference_unit?: string | null
          selling_price?: number | null
          sku?: string | null
          sort_order?: number
          supplier_id: string
          top_category?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          annual_order_value?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_th?: string | null
          flavor_profile?: string | null
          flavor_profile_en?: string | null
          flavor_profile_fr?: string | null
          flavor_profile_th?: string | null
          food_pairings?: string | null
          food_pairings_en?: string | null
          food_pairings_fr?: string | null
          food_pairings_th?: string | null
          grape_variety?: string | null
          grape_variety_en?: string | null
          grape_variety_fr?: string | null
          grape_variety_th?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_unit_id?: string | null
          organization_id?: string
          origin_country?: string | null
          origin_country_en?: string | null
          origin_country_fr?: string | null
          origin_country_th?: string | null
          packaging_unit?: number | null
          price?: number
          reference_price?: number | null
          reference_unit?: string | null
          selling_price?: number | null
          sku?: string | null
          sort_order?: number
          supplier_id?: string
          top_category?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_order_unit_id_fkey"
            columns: ["order_unit_id"]
            isOneToOne: false
            referencedRelation: "order_units"
            referencedColumns: ["id"]
          },
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
      b2b_customer_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          supplier_account_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          supplier_account_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          supplier_account_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customer_invitations_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_customer_purchase_order_items: {
        Row: {
          article_id: string | null
          article_name: string
          created_at: string | null
          id: string
          order_id: string
          quantity: number
          total_price: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          article_id?: string | null
          article_name: string
          created_at?: string | null
          id?: string
          order_id: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          article_id?: string | null
          article_name?: string
          created_at?: string | null
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customer_purchase_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "b2b_customer_vendor_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_customer_purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b2b_customer_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_customer_purchase_orders: {
        Row: {
          created_at: string | null
          customer_id: string
          delivery_address: string | null
          delivery_date: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          notes: string | null
          order_number: string
          status: string | null
          total_amount: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customer_purchase_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_customer_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "b2b_customer_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_customer_supplier_access: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customer_supplier_access_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_customer_supplier_access_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_customer_vendor_articles: {
        Row: {
          category: string | null
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          sku: string | null
          unit: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customer_vendor_articles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_customer_vendor_articles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "b2b_customer_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_customer_vendors: {
        Row: {
          address: string | null
          created_at: string | null
          customer_id: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          customer_id: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          customer_id?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customer_vendors_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_inventory_items: {
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
            foreignKeyName: "b2b_inventory_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "b2b_supplier_vendor_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_inventory_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "b2b_inventory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_inventory_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          supplier_account_id: string
          supplier_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          supplier_account_id: string
          supplier_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          supplier_account_id?: string
          supplier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_inventory_sessions_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_inventory_sessions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_mobile_tokens: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          supplier_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          is_active?: boolean
          supplier_id?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          supplier_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_mobile_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_mobile_tokens_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_supplier_purchase_order_items: {
        Row: {
          article_id: string | null
          article_name: string
          created_at: string | null
          id: string
          order_id: string
          quantity: number
          total_price: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          article_id?: string | null
          article_name: string
          created_at?: string | null
          id?: string
          order_id: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          article_id?: string | null
          article_name?: string
          created_at?: string | null
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_supplier_purchase_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "b2b_supplier_vendor_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_supplier_purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b2b_supplier_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_supplier_purchase_orders: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_date: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          notes: string | null
          order_number: string
          status: string | null
          supplier_account_id: string
          total_amount: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string | null
          supplier_account_id: string
          total_amount?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string | null
          supplier_account_id?: string
          total_amount?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_supplier_purchase_orders_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_supplier_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "b2b_supplier_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_supplier_users: {
        Row: {
          account_id: string
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["b2b_supplier_role"]
          supplier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["b2b_supplier_role"]
          supplier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["b2b_supplier_role"]
          supplier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_supplier_users_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_supplier_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_supplier_vendor_articles: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          sku: string | null
          supplier_account_id: string
          unit: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          sku?: string | null
          supplier_account_id: string
          unit?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          sku?: string | null
          supplier_account_id?: string
          unit?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_supplier_vendor_articles_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_supplier_vendor_articles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "b2b_supplier_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_supplier_vendors: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          supplier_account_id: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          supplier_account_id: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          supplier_account_id?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_supplier_vendors_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_supplier_vendors_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_suppliers: {
        Row: {
          account_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          order_delivery_method: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          order_delivery_method?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          order_delivery_method?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_suppliers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_draft_items: {
        Row: {
          article_id: string | null
          created_at: string
          draft_id: string
          free_text_name: string | null
          free_text_unit: string | null
          id: string
          is_free_text_item: boolean | null
          quantity: number
          supplier_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          draft_id: string
          free_text_name?: string | null
          free_text_unit?: string | null
          id?: string
          is_free_text_item?: boolean | null
          quantity?: number
          supplier_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          draft_id?: string
          free_text_name?: string | null
          free_text_unit?: string | null
          id?: string
          is_free_text_item?: boolean | null
          quantity?: number
          supplier_id?: string | null
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
          {
            foreignKeyName: "cart_draft_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_drafts: {
        Row: {
          created_at: string
          delivery_address: string | null
          desired_delivery_date: string | null
          desired_time_window: string | null
          employee_id: string | null
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
          desired_delivery_date?: string | null
          desired_time_window?: string | null
          employee_id?: string | null
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
          desired_delivery_date?: string | null
          desired_time_window?: string | null
          employee_id?: string | null
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
            foreignKeyName: "cart_drafts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
      communication_logs: {
        Row: {
          body_html: string | null
          confirmed_at: string | null
          created_at: string
          direction: string
          email_type: string
          employee_id: string | null
          error_message: string | null
          id: string
          order_id: string | null
          organization_id: string
          recipient_email: string
          recipient_name: string | null
          status: string
          subject: string
          supplier_id: string | null
        }
        Insert: {
          body_html?: string | null
          confirmed_at?: string | null
          created_at?: string
          direction?: string
          email_type: string
          employee_id?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          organization_id: string
          recipient_email: string
          recipient_name?: string | null
          status?: string
          subject: string
          supplier_id?: string | null
        }
        Update: {
          body_html?: string | null
          confirmed_at?: string | null
          created_at?: string
          direction?: string
          email_type?: string
          employee_id?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          organization_id?: string
          recipient_email?: string
          recipient_name?: string | null
          status?: string
          subject?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_article_prices: {
        Row: {
          article_id: string
          created_at: string
          custom_price: number
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          custom_price: number
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          custom_price?: number
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_article_prices_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_article_prices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
        ]
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
      edge_function_registry: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          is_active: boolean | null
          label_de: string
          label_en: string
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          is_active?: boolean | null
          label_de: string
          label_en: string
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          is_active?: boolean | null
          label_de?: string
          label_en?: string
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
      employee_article_favorites: {
        Row: {
          article_id: string
          created_at: string
          employee_id: string
          id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_article_favorites_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_article_favorites_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_location_suppliers: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          location_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          location_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_location_suppliers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_location_suppliers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_location_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_locations: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          location_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          location_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_locations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_notifications: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_notifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sessions: {
        Row: {
          created_at: string
          employee_id: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          expires_at?: string
          id?: string
          token?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auto_approve_orders: boolean
          can_add_free_items: boolean | null
          can_capture_photos: boolean | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          language: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          pin_code: string | null
          updated_at: string
          voice_input_enabled: boolean
          wine_catalog_access: string | null
        }
        Insert: {
          auto_approve_orders?: boolean
          can_add_free_items?: boolean | null
          can_capture_photos?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          pin_code?: string | null
          updated_at?: string
          voice_input_enabled?: boolean
          wine_catalog_access?: string | null
        }
        Update: {
          auto_approve_orders?: boolean
          can_add_free_items?: boolean | null
          can_capture_photos?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          pin_code?: string | null
          updated_at?: string
          voice_input_enabled?: boolean
          wine_catalog_access?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
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
      invoice_discrepancies: {
        Row: {
          actual_value: string | null
          created_at: string
          difference_amount: number | null
          difference_percent: number | null
          discrepancy_type: string
          expected_value: string | null
          id: string
          invoice_id: string
          invoice_item_id: string | null
          is_resolved: boolean
          order_item_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          actual_value?: string | null
          created_at?: string
          difference_amount?: number | null
          difference_percent?: number | null
          discrepancy_type: string
          expected_value?: string | null
          id?: string
          invoice_id: string
          invoice_item_id?: string | null
          is_resolved?: boolean
          order_item_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          actual_value?: string | null
          created_at?: string
          difference_amount?: number | null
          difference_percent?: number | null
          discrepancy_type?: string
          expected_value?: string | null
          id?: string
          invoice_id?: string
          invoice_item_id?: string | null
          is_resolved?: boolean
          order_item_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_discrepancies_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_discrepancies_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_discrepancies_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_email_log: {
        Row: {
          email_from: string
          email_subject: string | null
          error_message: string | null
          id: string
          invoice_id: string | null
          message_id: string
          organization_id: string
          processed_at: string
          status: string
        }
        Insert: {
          email_from: string
          email_subject?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_id: string
          organization_id: string
          processed_at?: string
          status?: string
        }
        Update: {
          email_from?: string
          email_subject?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string
          organization_id?: string
          processed_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_email_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_email_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          article_name: string
          article_sku: string | null
          created_at: string
          id: string
          invoice_id: string
          matched_article_id: string | null
          matched_order_item_id: string | null
          position_number: number | null
          quantity: number
          total_price: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          article_name: string
          article_sku?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          matched_article_id?: string | null
          matched_order_item_id?: string | null
          position_number?: number | null
          quantity: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          article_name?: string
          article_sku?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          matched_article_id?: string | null
          matched_order_item_id?: string | null
          position_number?: number | null
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_matched_article_id_fkey"
            columns: ["matched_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_matched_order_item_id_fkey"
            columns: ["matched_order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_processing_status: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          new_invoices: number
          organization_id: string
          processed_pdfs: number
          skipped_duplicates: number
          started_at: string
          status: string
          total_pdfs: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          new_invoices?: number
          organization_id: string
          processed_pdfs?: number
          skipped_duplicates?: number
          started_at?: string
          status?: string
          total_pdfs?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          new_invoices?: number
          organization_id?: string
          processed_pdfs?: number
          skipped_duplicates?: number
          started_at?: string
          status?: string
          total_pdfs?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_processing_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string | null
          customer_number: string | null
          delivery_date: string | null
          due_date: string | null
          email_from: string | null
          email_message_id: string | null
          email_received_at: string | null
          email_subject: string | null
          gross_amount: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          location_id: string | null
          matched_order_id: string | null
          net_amount: number | null
          notes: string | null
          organization_id: string
          parsed_data: Json | null
          pdf_url: string | null
          status: string
          supplier_id: string | null
          updated_at: string
          vat_amount: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_number?: string | null
          delivery_date?: string | null
          due_date?: string | null
          email_from?: string | null
          email_message_id?: string | null
          email_received_at?: string | null
          email_subject?: string | null
          gross_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          matched_order_id?: string | null
          net_amount?: number | null
          notes?: string | null
          organization_id: string
          parsed_data?: Json | null
          pdf_url?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          vat_amount?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_number?: string | null
          delivery_date?: string | null
          due_date?: string | null
          email_from?: string | null
          email_message_id?: string | null
          email_received_at?: string | null
          email_subject?: string | null
          gross_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          matched_order_id?: string | null
          net_amount?: number | null
          notes?: string | null
          organization_id?: string
          parsed_data?: Json | null
          pdf_url?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matched_order_id_fkey"
            columns: ["matched_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          short_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          short_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
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
      magic_link_rate_limits: {
        Row: {
          created_at: string
          id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "magic_link_rate_limits_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_order_confirmation: boolean
          email_order_status: boolean
          email_preorder_received: boolean
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
          email_preorder_received?: boolean
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
          email_preorder_received?: boolean
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
          article_id: string | null
          article_name: string
          created_at: string
          free_text_description: string | null
          id: string
          is_free_text_item: boolean | null
          order_id: string
          order_unit: string | null
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          article_id?: string | null
          article_name: string
          created_at?: string
          free_text_description?: string | null
          id?: string
          is_free_text_item?: boolean | null
          order_id: string
          order_unit?: string | null
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Update: {
          article_id?: string | null
          article_name?: string
          created_at?: string
          free_text_description?: string | null
          id?: string
          is_free_text_item?: boolean | null
          order_id?: string
          order_unit?: string | null
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
      order_units: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
          address: string | null
          advanced_view_enabled: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          demo_expires_at: string | null
          developer_checklist_notes: string | null
          id: string
          is_demo: boolean | null
          is_sponsored: boolean
          last_invoice_email_check: string | null
          name: string
          source_b2b_customer_id: string | null
          source_type: string | null
          sponsored_features: Json | null
          sponsored_note: string | null
          subscription_tier: string
          test_email: string | null
          test_emails: string[] | null
          test_mode_enabled: boolean
          trial_ends_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          advanced_view_enabled?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          demo_expires_at?: string | null
          developer_checklist_notes?: string | null
          id?: string
          is_demo?: boolean | null
          is_sponsored?: boolean
          last_invoice_email_check?: string | null
          name: string
          source_b2b_customer_id?: string | null
          source_type?: string | null
          sponsored_features?: Json | null
          sponsored_note?: string | null
          subscription_tier?: string
          test_email?: string | null
          test_emails?: string[] | null
          test_mode_enabled?: boolean
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          advanced_view_enabled?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          demo_expires_at?: string | null
          developer_checklist_notes?: string | null
          id?: string
          is_demo?: boolean | null
          is_sponsored?: boolean
          last_invoice_email_check?: string | null
          name?: string
          source_b2b_customer_id?: string | null
          source_type?: string | null
          sponsored_features?: Json | null
          sponsored_note?: string | null
          subscription_tier?: string
          test_email?: string | null
          test_emails?: string[] | null
          test_mode_enabled?: boolean
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_source_b2b_customer_id_fkey"
            columns: ["source_b2b_customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_capture_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          organization_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_capture_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_verification_rate_limits: {
        Row: {
          created_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      price_watch_alerts: {
        Row: {
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          is_read: boolean
          organization_id: string
          result_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_read?: boolean
          organization_id: string
          result_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_read?: boolean
          organization_id?: string
          result_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_watch_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_watch_alerts_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "price_watch_results"
            referencedColumns: ["id"]
          },
        ]
      }
      price_watch_results: {
        Row: {
          article_category: string | null
          article_id: string | null
          article_name: string
          created_at: string
          current_price: number
          expires_at: string
          found_price: number
          found_supplier: string
          id: string
          is_dismissed: boolean
          is_reviewed: boolean
          notes: string | null
          organization_id: string
          savings_amount: number
          savings_percent: number
          search_query: string
          searched_at: string
          source_url: string | null
        }
        Insert: {
          article_category?: string | null
          article_id?: string | null
          article_name: string
          created_at?: string
          current_price: number
          expires_at?: string
          found_price: number
          found_supplier: string
          id?: string
          is_dismissed?: boolean
          is_reviewed?: boolean
          notes?: string | null
          organization_id: string
          savings_amount: number
          savings_percent: number
          search_query: string
          searched_at?: string
          source_url?: string | null
        }
        Update: {
          article_category?: string | null
          article_id?: string | null
          article_name?: string
          created_at?: string
          current_price?: number
          expires_at?: string
          found_price?: number
          found_supplier?: string
          id?: string
          is_dismissed?: boolean
          is_reviewed?: boolean
          notes?: string | null
          organization_id?: string
          savings_amount?: number
          savings_percent?: number
          search_query?: string
          searched_at?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_watch_results_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_watch_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_watch_settings: {
        Row: {
          categories: Json
          created_at: string
          email_notifications: boolean
          id: string
          is_enabled: boolean
          last_search_at: string | null
          last_search_results_count: number | null
          min_savings_percent: number
          organization_id: string
          search_frequency: string
          search_radius_km: number
          updated_at: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_enabled?: boolean
          last_search_at?: string | null
          last_search_results_count?: number | null
          min_savings_percent?: number
          organization_id: string
          search_frequency?: string
          search_radius_km?: number
          updated_at?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_enabled?: boolean
          last_search_at?: string | null
          last_search_results_count?: number | null
          min_savings_percent?: number
          organization_id?: string
          search_frequency?: string
          search_radius_km?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_watch_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          color_scheme: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          color_scheme?: string | null
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
      simple_order_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          token?: string
        }
        Relationships: []
      }
      simple_order_token_suppliers: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          supplier_id: string
          token_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          supplier_id: string
          token_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          supplier_id?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_order_token_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_order_token_suppliers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "simple_order_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_order_tokens: {
        Row: {
          created_at: string
          employee_id: string | null
          employee_name: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_multi_supplier: boolean
          label: string
          language: string
          location_id: string | null
          organization_id: string
          supplier_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_multi_supplier?: boolean
          label: string
          language?: string
          location_id?: string | null
          organization_id: string
          supplier_id?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_multi_supplier?: boolean
          label?: string
          language?: string
          location_id?: string | null
          organization_id?: string
          supplier_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_order_tokens_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_order_tokens_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_order_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_order_tokens_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suggested_articles: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          employee_id: string | null
          id: string
          image_url: string | null
          location_id: string | null
          name: string
          order_id: string | null
          organization_id: string
          origin_country: string | null
          price: number
          reviewed_at: string | null
          reviewed_by: string | null
          sku: string | null
          source: string | null
          status: string
          supplier_comment: string | null
          supplier_id: string
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name: string
          order_id?: string | null
          organization_id: string
          origin_country?: string | null
          price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string | null
          source?: string | null
          status?: string
          supplier_comment?: string | null
          supplier_id: string
          unit?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name?: string
          order_id?: string | null
          organization_id?: string
          origin_country?: string | null
          price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string | null
          source?: string | null
          status?: string
          supplier_comment?: string | null
          supplier_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_articles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_articles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
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
      supplier_b2b_accounts: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          linked_supplier_id: string | null
          logo_url: string | null
          owner_user_id: string | null
          primary_color: string | null
          secondary_color: string | null
          subdomain: string
          subscription_tier:
            | Database["public"]["Enums"]["b2b_subscription_tier"]
            | null
          updated_at: string
          upgraded_at: string | null
          upgraded_organization_id: string | null
          welcome_message: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          linked_supplier_id?: string | null
          logo_url?: string | null
          owner_user_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          subdomain: string
          subscription_tier?:
            | Database["public"]["Enums"]["b2b_subscription_tier"]
            | null
          updated_at?: string
          upgraded_at?: string | null
          upgraded_organization_id?: string | null
          welcome_message?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          linked_supplier_id?: string | null
          logo_url?: string | null
          owner_user_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          subdomain?: string
          subscription_tier?:
            | Database["public"]["Enums"]["b2b_subscription_tier"]
            | null
          updated_at?: string
          upgraded_at?: string | null
          upgraded_organization_id?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_b2b_accounts_linked_supplier_id_fkey"
            columns: ["linked_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_accounts_upgraded_organization_id_fkey"
            columns: ["upgraded_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_b2b_articles: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sku: string | null
          sort_order: number | null
          source_article_id: string | null
          supplier_account_id: string
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sku?: string | null
          sort_order?: number | null
          source_article_id?: string | null
          supplier_account_id: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sku?: string | null
          sort_order?: number | null
          source_article_id?: string | null
          supplier_account_id?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_b2b_articles_source_article_id_fkey"
            columns: ["source_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_articles_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_articles_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_b2b_customers: {
        Row: {
          company_name: string
          contact_person: string | null
          created_at: string
          customer_number: string | null
          delivery_address: string | null
          email: string
          has_purchase_feature: boolean | null
          id: string
          is_active: boolean | null
          phone: string | null
          supplier_account_id: string
          supplier_id: string | null
          updated_at: string
          upgraded_at: string | null
          upgraded_organization_id: string | null
          user_id: string | null
        }
        Insert: {
          company_name: string
          contact_person?: string | null
          created_at?: string
          customer_number?: string | null
          delivery_address?: string | null
          email: string
          has_purchase_feature?: boolean | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          supplier_account_id: string
          supplier_id?: string | null
          updated_at?: string
          upgraded_at?: string | null
          upgraded_organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string
          contact_person?: string | null
          created_at?: string
          customer_number?: string | null
          delivery_address?: string | null
          email?: string
          has_purchase_feature?: boolean | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          supplier_account_id?: string
          supplier_id?: string | null
          updated_at?: string
          upgraded_at?: string | null
          upgraded_organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_b2b_customers_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_customers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_customers_upgraded_organization_id_fkey"
            columns: ["upgraded_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_b2b_offer_items: {
        Row: {
          article_id: string | null
          article_name: string
          created_at: string
          id: string
          offer_id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          article_id?: string | null
          article_name: string
          created_at?: string
          id?: string
          offer_id: string
          quantity?: number
          total_price: number
          unit?: string
          unit_price: number
        }
        Update: {
          article_id?: string | null
          article_name?: string
          created_at?: string
          id?: string
          offer_id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_b2b_offer_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_offer_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_b2b_offers: {
        Row: {
          accepted_at: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          offer_number: string
          sent_at: string | null
          status: string
          supplier_account_id: string
          supplier_id: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          offer_number?: string
          sent_at?: string | null
          status?: string
          supplier_account_id: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          offer_number?: string
          sent_at?: string | null
          status?: string
          supplier_account_id?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_b2b_offers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_offers_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_b2b_order_items: {
        Row: {
          article_id: string | null
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
          article_id?: string | null
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
          article_id?: string | null
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
            foreignKeyName: "supplier_b2b_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_b2b_orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_date: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          notes: string | null
          order_number: string
          status: Database["public"]["Enums"]["b2b_order_status"] | null
          supplier_account_id: string
          supplier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          status?: Database["public"]["Enums"]["b2b_order_status"] | null
          supplier_account_id: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["b2b_order_status"] | null
          supplier_account_id?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_b2b_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_orders_supplier_account_id_fkey"
            columns: ["supplier_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_b2b_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_b2b_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
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
      supplier_order_views: {
        Row: {
          confirmed_at: string | null
          created_at: string
          id: string
          order_id: string
          seen_at: string | null
          supplier_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          seen_at?: string | null
          supplier_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          seen_at?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_views_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_views_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_own_articles: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          sku: string | null
          supplier_id: string
          unit: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          sku?: string | null
          supplier_id: string
          unit?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          sku?: string | null
          supplier_id?: string
          unit?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_own_articles_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_own_articles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_own_inventory_items: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          notes: string | null
          session_id: string
          storage_1: number | null
          storage_2: number | null
          total: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          session_id: string
          storage_1?: number | null
          storage_2?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          session_id?: string
          storage_1?: number | null
          storage_2?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_own_inventory_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_own_inventory_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_inventory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_own_inventory_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          status: string | null
          supplier_id: string
          vendor_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          supplier_id: string
          vendor_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          supplier_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_own_inventory_sessions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_own_inventory_sessions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_own_purchase_order_items: {
        Row: {
          article_id: string | null
          article_name: string
          created_at: string
          id: string
          order_id: string
          quantity: number
          total_price: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          article_id?: string | null
          article_name: string
          created_at?: string
          id?: string
          order_id: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          article_id?: string | null
          article_name?: string
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_own_purchase_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_own_purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_own_purchase_orders: {
        Row: {
          created_at: string
          delivery_date: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          notes: string | null
          order_number: string
          status: string
          supplier_id: string
          total_amount: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          supplier_id: string
          total_amount?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          delivery_date?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_own_purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_own_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "supplier_own_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_own_vendors: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_own_vendors_supplier_id_fkey"
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
          visible_columns: Json | null
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
          visible_columns?: Json | null
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
          visible_columns?: Json | null
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
          is_active: boolean
          price_edit_expires_at: string | null
          supplier_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          price_edit_expires_at?: string | null
          supplier_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          price_edit_expires_at?: string | null
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
          invoice_email: string | null
          is_active: boolean
          minimum_order_value: number | null
          name: string
          order_delivery_method: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          customer_number?: string | null
          email: string
          id?: string
          invoice_email?: string | null
          is_active?: boolean
          minimum_order_value?: number | null
          name: string
          order_delivery_method?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          customer_number?: string | null
          email?: string
          id?: string
          invoice_email?: string | null
          is_active?: boolean
          minimum_order_value?: number | null
          name?: string
          order_delivery_method?: string | null
          organization_id?: string
          phone?: string | null
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
      system_feature_priorities: {
        Row: {
          category: string
          feature_key: string
          id: string
          is_worked_on: boolean | null
          notes: string | null
          organization_id: string
          priority: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          feature_key: string
          id?: string
          is_worked_on?: boolean | null
          notes?: string | null
          organization_id: string
          priority?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          feature_key?: string
          id?: string
          is_worked_on?: boolean | null
          notes?: string | null
          organization_id?: string
          priority?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_feature_priorities_organization_id_fkey"
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
      translation_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          language_code: string
          organization_id: string
          original_value: string | null
          override_value: string
          translation_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          language_code: string
          organization_id: string
          original_value?: string | null
          override_value: string
          translation_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          language_code?: string
          organization_id?: string
          original_value?: string | null
          override_value?: string
          translation_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_overrides_organization_id_fkey"
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
      user_delivery_preferences: {
        Row: {
          created_at: string | null
          delivery_address_id: string
          id: string
          location_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address_id: string
          id?: string
          location_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address_id?: string
          id?: string
          location_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_delivery_preferences_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_delivery_preferences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
      wine_quiz_scores: {
        Row: {
          correct_answers: number
          employee_id: string | null
          employee_name: string
          id: string
          level_reached: number
          organization_id: string
          played_at: string
          questions_answered: number
          score: number
        }
        Insert: {
          correct_answers?: number
          employee_id?: string | null
          employee_name: string
          id?: string
          level_reached?: number
          organization_id: string
          played_at?: string
          questions_answered?: number
          score?: number
        }
        Update: {
          correct_answers?: number
          employee_id?: string | null
          employee_name?: string
          id?: string
          level_reached?: number
          organization_id?: string
          played_at?: string
          questions_answered?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "wine_quiz_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wine_quiz_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_employee_sessions: { Args: never; Returns: undefined }
      cleanup_old_magic_link_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_pin_verification_rate_limits: { Args: never; Returns: undefined }
      cleanup_simple_order_rate_limits: { Args: never; Returns: undefined }
      generate_b2b_offer_number: { Args: never; Returns: string }
      generate_b2b_order_number: { Args: never; Returns: string }
      generate_b2b_purchase_order_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      get_b2b_customer_id: { Args: { p_user_id: string }; Returns: string }
      get_b2b_supplier_account_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_b2b_supplier_user_supplier_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_organization_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_b2b_customer: {
        Args: { p_account_id: string; p_user_id: string }
        Returns: boolean
      }
      is_b2b_supplier_owner: {
        Args: { p_account_id: string; p_user_id: string }
        Returns: boolean
      }
      is_b2b_supplier_user: {
        Args: { p_supplier_id: string; p_user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      remove_team_member: {
        Args: { member_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "purchaser" | "viewer"
      b2b_order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      b2b_subscription_tier: "starter" | "professional" | "enterprise"
      b2b_supplier_role: "owner" | "manager" | "viewer"
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
      b2b_order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      b2b_subscription_tier: ["starter", "professional", "enterprise"],
      b2b_supplier_role: ["owner", "manager", "viewer"],
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
