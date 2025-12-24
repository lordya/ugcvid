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
      batch_video_items: {
        Row: {
          batch_id: string
          created_at: string | null
          credits_used: number | null
          custom_title: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          row_index: number
          status: string
          style: string | null
          updated_at: string | null
          url: string
          video_id: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          credits_used?: number | null
          custom_title?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          row_index: number
          status?: string
          style?: string | null
          updated_at?: string | null
          url: string
          video_id?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          credits_used?: number | null
          custom_title?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          row_index?: number
          status?: string
          style?: string | null
          updated_at?: string | null
          url?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_video_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "video_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_video_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          payment_id: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string
          created_at: string
          id: string
          metadata: Json | null
          provider: Database["public"]["Enums"]["social_provider"]
          provider_display_name: string | null
          provider_user_id: string
          provider_username: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["social_provider"]
          provider_display_name?: string | null
          provider_user_id: string
          provider_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["social_provider"]
          provider_display_name?: string | null
          provider_user_id?: string
          provider_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          banned: boolean
          created_at: string
          credits_balance: number
          display_name: string | null
          email: string
          id: string
          preferences: Json
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          email: string
          id: string
          preferences?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          email?: string
          id?: string
          preferences?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_batches: {
        Row: {
          created_at: string | null
          error_message: string | null
          failed_items: number
          id: string
          metadata: Json | null
          processed_items: number
          status: string
          total_credits_reserved: number
          total_items: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          failed_items?: number
          id?: string
          metadata?: Json | null
          processed_items?: number
          status?: string
          total_credits_reserved?: number
          total_items: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          failed_items?: number
          id?: string
          metadata?: Json | null
          processed_items?: number
          status?: string
          total_credits_reserved?: number
          total_items?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_posts: {
        Row: {
          analytics_last_updated: string | null
          created_at: string
          error_message: string | null
          external_post_id: string | null
          id: string
          integration_id: string
          like_count: number | null
          posted_at: string | null
          share_count: number | null
          status: Database["public"]["Enums"]["video_post_status"]
          updated_at: string
          video_id: string
          view_count: number | null
        }
        Insert: {
          analytics_last_updated?: string | null
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          integration_id: string
          like_count?: number | null
          posted_at?: string | null
          share_count?: number | null
          status?: Database["public"]["Enums"]["video_post_status"]
          updated_at?: string
          video_id: string
          view_count?: number | null
        }
        Update: {
          analytics_last_updated?: string | null
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          integration_id?: string
          like_count?: number | null
          posted_at?: string | null
          share_count?: number | null
          status?: Database["public"]["Enums"]["video_post_status"]
          updated_at?: string
          video_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_posts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_posts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          error_reason: string | null
          final_script: string | null
          id: string
          input_metadata: Json | null
          is_high_performer: boolean | null
          is_low_performer: boolean | null
          kie_task_id: string | null
          performance_calculated_at: string | null
          performance_score: number | null
          status: Database["public"]["Enums"]["video_status"]
          storage_path: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          error_reason?: string | null
          final_script?: string | null
          id?: string
          input_metadata?: Json | null
          is_high_performer?: boolean | null
          is_low_performer?: boolean | null
          kie_task_id?: string | null
          performance_calculated_at?: string | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          storage_path?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          error_reason?: string | null
          final_script?: string | null
          id?: string
          input_metadata?: Json | null
          is_high_performer?: boolean | null
          is_low_performer?: boolean | null
          kie_task_id?: string | null
          performance_calculated_at?: string | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          storage_path?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_update_performer_status: { Args: never; Returns: number }
      calculate_user_rolling_average: {
        Args: { user_uuid: string }
        Returns: number
      }
      calculate_video_performance_score: {
        Args: { video_uuid: string }
        Returns: number
      }
      decrypt_token: { Args: { encrypted_token: string }; Returns: string }
      encrypt_token: { Args: { token_text: string }; Returns: string }
      get_batch_statistics: {
        Args: { user_uuid: string }
        Returns: {
          completed_batches: number
          failed_batches: number
          processing_batches: number
          total_batches: number
          total_credits_used: number
          total_videos_processed: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      update_video_performer_status: {
        Args: { video_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      payment_provider: "LEMON" | "CRYPTO" | "SYSTEM" | "KIE_AI"
      social_provider: "TIKTOK" | "YOUTUBE" | "INSTAGRAM"
      transaction_type: "PURCHASE" | "GENERATION" | "REFUND" | "BONUS"
      video_post_status: "PENDING" | "PUBLISHED" | "FAILED"
      video_status:
        | "DRAFT"
        | "SCRIPT_GENERATED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
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
      payment_provider: ["LEMON", "CRYPTO", "SYSTEM", "KIE_AI"],
      social_provider: ["TIKTOK", "YOUTUBE", "INSTAGRAM"],
      transaction_type: ["PURCHASE", "GENERATION", "REFUND", "BONUS"],
      video_post_status: ["PENDING", "PUBLISHED", "FAILED"],
      video_status: [
        "DRAFT",
        "SCRIPT_GENERATED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
    },
  },
} as const
