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
      deliveries: {
        Row: {
          created_at: string
          delivery_notes: string | null
          delivery_person_id: string | null
          delivery_time: string | null
          donation_id: string
          id: string
          pickup_time: string | null
          request_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_notes?: string | null
          delivery_person_id?: string | null
          delivery_time?: string | null
          donation_id: string
          id?: string
          pickup_time?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_notes?: string | null
          delivery_person_id?: string | null
          delivery_time?: string | null
          donation_id?: string
          id?: string
          pickup_time?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "food_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "donation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_requests: {
        Row: {
          donation_id: string
          id: string
          message: string | null
          receiver_id: string
          requested_at: string
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          donation_id: string
          id?: string
          message?: string | null
          receiver_id: string
          requested_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          donation_id?: string
          id?: string
          message?: string | null
          receiver_id?: string
          requested_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donation_requests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "food_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_donations: {
        Row: {
          allergens: string[] | null
          created_at: string
          description: string
          dietary_info: string[] | null
          donor_id: string
          expiry_date: string
          food_type: string
          id: string
          images: string[] | null
          pickup_latitude: number | null
          pickup_location: string
          pickup_longitude: number | null
          quantity: string
          serves_people: number | null
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string
          description: string
          dietary_info?: string[] | null
          donor_id: string
          expiry_date: string
          food_type: string
          id?: string
          images?: string[] | null
          pickup_latitude?: number | null
          pickup_location: string
          pickup_longitude?: number | null
          quantity: string
          serves_people?: number | null
          status?: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          created_at?: string
          description?: string
          dietary_info?: string[] | null
          donor_id?: string
          expiry_date?: string
          food_type?: string
          id?: string
          images?: string[] | null
          pickup_latitude?: number | null
          pickup_location?: string
          pickup_longitude?: number | null
          quantity?: string
          serves_people?: number | null
          status?: Database["public"]["Enums"]["donation_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          organization_name: string | null
          phone: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          latitude?: number | null
          longitude?: number | null
          organization_name?: string | null
          phone: string
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_name?: string | null
          phone?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_profile: { Args: { profile_id: string }; Returns: boolean }
      create_delivery: {
        Args: {
          p_delivery_person_id?: string
          p_donation_id: string
          p_request_id: string
        }
        Returns: string
      }
    }
    Enums: {
      delivery_status: "assigned" | "in_transit" | "delivered" | "failed"
      donation_status:
        | "available"
        | "requested"
        | "confirmed"
        | "picked_up"
        | "delivered"
        | "cancelled"
      request_status: "pending" | "approved" | "rejected" | "completed"
      user_type: "donor" | "receiver" | "delivery"
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
      delivery_status: ["assigned", "in_transit", "delivered", "failed"],
      donation_status: [
        "available",
        "requested",
        "confirmed",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      request_status: ["pending", "approved", "rejected", "completed"],
      user_type: ["donor", "receiver", "delivery"],
    },
  },
} as const
