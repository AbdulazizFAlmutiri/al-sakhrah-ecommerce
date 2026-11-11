// Generated from the Supabase project schema (generate_typescript_types).
// Regenerate after every migration; do not edit by hand.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type OrderStatus = Database["public"]["Enums"]["order_status"]
type AppLocale = Database["public"]["Enums"]["app_locale"]
type AppRole = Database["public"]["Enums"]["app_role"]
type ProofOutcome = Database["public"]["Enums"]["proof_outcome"]

type OrderRow = {
  branch_id: string
  created_at: string
  created_by: string
  delivered_at: string | null
  delivery_date: string
  driver_id: string | null
  eta: string | null
  external: boolean
  id: string
  notes: string | null
  po_number: string
  po_photo_path: string | null
  ready_at: string | null
  sales_rep_id: string
  status: OrderStatus
  status_changed_at: string
  stop_seq: number | null
  trip_id: string | null
  updated_at: string
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address_text: string | null
          created_at: string
          customer_id: string
          google_place_id: string | null
          id: string
          lat: number
          lng: number
          name: string
          phone: string | null
        }
        Insert: {
          address_text?: string | null
          created_at?: string
          customer_id: string
          google_place_id?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          phone?: string | null
        }
        Update: {
          address_text?: string | null
          created_at?: string
          customer_id?: string
          google_place_id?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: { created_at: string; id: string; name: string }
        Insert: { created_at?: string; id?: string; name: string }
        Update: { created_at?: string; id?: string; name?: string }
        Relationships: []
      }
      driver_locations: {
        Row: {
          accuracy_m: number | null
          client_id: string
          driver_id: string
          id: number
          lat: number
          lng: number
          recorded_at: string
          speed: number | null
          trip_id: string
        }
        Insert: {
          accuracy_m?: number | null
          client_id: string
          driver_id: string
          id?: never
          lat: number
          lng: number
          recorded_at: string
          speed?: number | null
          trip_id: string
        }
        Update: {
          accuracy_m?: number | null
          client_id?: string
          driver_id?: string
          id?: never
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      failure_reasons: {
        Row: {
          active: boolean
          code: string
          icon: string
          id: string
          label_ar: string
          label_en: string
          label_ur: string
          sort: number
        }
        Insert: {
          active?: boolean
          code: string
          icon: string
          id?: string
          label_ar: string
          label_en: string
          label_ur: string
          sort?: number
        }
        Update: {
          active?: boolean
          code?: string
          icon?: string
          id?: string
          label_ar?: string
          label_en?: string
          label_ur?: string
          sort?: number
        }
        Relationships: []
      }
      login_attempts: {
        Row: { attempted_at: string; id: number; success: boolean; username: string }
        Insert: { attempted_at?: string; id?: never; success: boolean; username: string }
        Update: { attempted_at?: string; id?: never; success?: boolean; username?: string }
        Relationships: []
      }
      order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: OrderStatus | null
          id: number
          meta: Json
          order_id: string
          to_status: OrderStatus
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: OrderStatus | null
          id?: never
          meta?: Json
          order_id: string
          to_status: OrderStatus
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: OrderStatus | null
          id?: never
          meta?: Json
          order_id?: string
          to_status?: OrderStatus
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: OrderRow
        Insert: {
          branch_id: string
          created_at?: string
          created_by: string
          delivered_at?: string | null
          delivery_date?: string
          driver_id?: string | null
          eta?: string | null
          external?: boolean
          id?: string
          notes?: string | null
          po_number: string
          po_photo_path?: string | null
          ready_at?: string | null
          sales_rep_id: string
          status?: OrderStatus
          status_changed_at?: string
          stop_seq?: number | null
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          delivery_date?: string
          driver_id?: string | null
          eta?: string | null
          external?: boolean
          id?: string
          notes?: string | null
          po_number?: string
          po_photo_path?: string | null
          ready_at?: string | null
          sales_rep_id?: string
          status?: OrderStatus
          status_changed_at?: string
          stop_seq?: number | null
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          locale: AppLocale
          must_change_password: boolean
          role: AppRole
          user_id: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          locale?: AppLocale
          must_change_password?: boolean
          role: AppRole
          user_id: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          locale?: AppLocale
          must_change_password?: boolean
          role?: AppRole
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      proofs: {
        Row: {
          accuracy_m: number | null
          client_id: string
          far_from_store: boolean
          id: string
          lat: number | null
          lng: number | null
          note: string | null
          order_id: string
          outcome: ProofOutcome
          photo_path: string | null
          reason_id: string | null
          recorded_at: string
          synced_at: string
        }
        Insert: {
          accuracy_m?: number | null
          client_id: string
          far_from_store?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          order_id: string
          outcome: ProofOutcome
          photo_path?: string | null
          reason_id?: string | null
          recorded_at: string
          synced_at?: string
        }
        Update: {
          accuracy_m?: number | null
          client_id?: string
          far_from_store?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          order_id?: string
          outcome?: ProofOutcome
          photo_path?: string | null
          reason_id?: string | null
          recorded_at?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "failure_reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_reps: {
        Row: { active: boolean; created_at: string; id: string; name: string }
        Insert: { active?: boolean; created_at?: string; id?: string; name: string }
        Update: { active?: boolean; created_at?: string; id?: string; name?: string }
        Relationships: []
      }
      trips: {
        Row: {
          distance_m: number | null
          driver_id: string
          end_reason: string | null
          ended_at: string | null
          id: string
          polyline: string | null
          started_at: string
          warehouse_id: string
        }
        Insert: {
          distance_m?: number | null
          driver_id: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          polyline?: string | null
          started_at?: string
          warehouse_id: string
        }
        Update: {
          distance_m?: number | null
          driver_id?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          polyline?: string | null
          started_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trips_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: { created_at: string; id: string; lat: number | null; lng: number | null; name: string }
        Insert: { created_at?: string; id?: string; lat?: number | null; lng?: number | null; name: string }
        Update: { created_at?: string; id?: string; lat?: number | null; lng?: number | null; name?: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _create_user: {
        Args: {
          p_full_name: string
          p_locale: AppLocale
          p_must_change: boolean
          p_password: string
          p_role: AppRole
          p_username: string
        }
        Returns: string
      }
      admin_create_user: {
        Args: {
          p_full_name: string
          p_locale: AppLocale
          p_password: string
          p_role: AppRole
          p_username: string
        }
        Returns: string
      }
      admin_reset_password: {
        Args: { p_password: string; p_user_id: string }
        Returns: undefined
      }
      admin_update_user: {
        Args: {
          p_active: boolean
          p_full_name: string
          p_locale: AppLocale
          p_role: AppRole
          p_user_id: string
        }
        Returns: undefined
      }
      app_role: { Args: never; Returns: AppRole }
      bootstrap_admin: {
        Args: { p_full_name: string; p_password: string; p_username: string }
        Returns: string
      }
      clear_must_change_password: { Args: never; Returns: undefined }
      login_is_locked: { Args: { p_username: string }; Returns: boolean }
      record_login_attempt: {
        Args: { p_success: boolean; p_username: string }
        Returns: undefined
      }
      riyadh_today: { Args: never; Returns: string }
      set_my_locale: { Args: { p_locale: AppLocale }; Returns: undefined }
      start_trip: { Args: { p_lat?: number; p_lng?: number }; Returns: string }
      set_trip_route: { Args: { p_trip: string; p_stops: Json; p_polyline?: string; p_distance_m?: number }; Returns: undefined }
      record_proof: {
        Args: {
          p_client_id: string; p_order_id: string; p_outcome: ProofOutcome; p_reason_id?: string; p_note?: string;
          p_photo_path?: string; p_lat?: number; p_lng?: number; p_accuracy?: number; p_recorded_at?: string
        }
        Returns: Database["public"]["Tables"]["proofs"]["Row"]
      }
      end_trip: { Args: { p_reason?: string }; Returns: undefined }
      haversine_m: { Args: { lat1: number; lng1: number; lat2: number; lng2: number }; Returns: number }
      transition_order: {
        Args: { p_meta?: Json; p_order_id: string; p_to: OrderStatus }
        Returns: OrderRow
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_locale: "ar" | "en" | "ur"
      app_role: "admin" | "sales" | "warehouse" | "driver"
      order_status: "new" | "ready" | "on_the_way" | "delivered" | "failed" | "cancelled"
      proof_outcome: "delivered" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      app_locale: ["ar", "en", "ur"],
      app_role: ["admin", "sales", "warehouse", "driver"],
      order_status: ["new", "ready", "on_the_way", "delivered", "failed", "cancelled"],
      proof_outcome: ["delivered", "failed"],
    },
  },
} as const
