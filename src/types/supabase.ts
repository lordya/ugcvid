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
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
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
      video_posts: {
        Row: {
          id: string
          video_id: string
          integration_id: string
          external_post_id: string | null
          status: Database["public"]["Enums"]["video_post_status"]
          error_message: string | null
          posted_at: string | null
          view_count: number | null
          like_count: number | null
          share_count: number | null
          analytics_last_updated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          integration_id: string
          external_post_id?: string | null
          status?: Database["public"]["Enums"]["video_post_status"]
          error_message?: string | null
          posted_at?: string | null
          view_count?: number | null
          like_count?: number | null
          share_count?: number | null
          analytics_last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          integration_id?: string
          external_post_id?: string | null
          status?: Database["public"]["Enums"]["video_post_status"]
          error_message?: string | null
          posted_at?: string | null
          view_count?: number | null
          like_count?: number | null
          share_count?: number | null
          analytics_last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_posts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_posts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_batches: {
        Row: {
          id: string
          user_id: string
          status: Database["public"]["Enums"]["batch_status"]
          total_items: number
          processed_items: number
          failed_items: number
          total_credits_reserved: number
          error_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: Database["public"]["Enums"]["batch_status"]
          total_items: number
          processed_items?: number
          failed_items?: number
          total_credits_reserved?: number
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: Database["public"]["Enums"]["batch_status"]
          total_items?: number
          processed_items?: number
          failed_items?: number
          total_credits_reserved?: number
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
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
      batch_video_items: {
        Row: {
          id: string
          batch_id: string
          video_id: string | null
          row_index: number
          url: string
          custom_title: string | null
          style: string | null
          status: Database["public"]["Enums"]["batch_item_status"]
          error_message: string | null
          credits_used: number
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          video_id?: string | null
          row_index: number
          url: string
          custom_title?: string | null
          style?: string | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          error_message?: string | null
          credits_used?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          video_id?: string | null
          row_index?: number
          url?: string
          custom_title?: string | null
          style?: string | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          error_message?: string | null
          credits_used?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_provider: "LEMON" | "CRYPTO" | "SYSTEM"
      transaction_type: "PURCHASE" | "GENERATION" | "REFUND" | "BONUS"
      video_status:
        | "DRAFT"
        | "SCRIPT_GENERATED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
      batch_status:
        | "PENDING"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
      batch_item_status:
        | "PENDING"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
      video_post_status:
        | "PENDING"
        | "PUBLISHED"
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
      payment_provider: ["LEMON", "CRYPTO", "SYSTEM"],
      transaction_type: ["PURCHASE", "GENERATION", "REFUND", "BONUS"],
      video_status: [
        "DRAFT",
        "SCRIPT_GENERATED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      batch_status: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      batch_item_status: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      video_post_status: [
        "PENDING",
        "PUBLISHED",
        "FAILED",
      ],
    },
  },
} as const

// UGC Content Types (matching n8n workflow structure)
export interface UGCContent {
  Title: string // Exactly 100 characters (padded/truncated)
  Caption: string // Social media caption
  Description: string // Product description
  Prompt: string // Video generation prompt for AI
  aspect_ratio: 'portrait' // Always 'portrait' for TikTok/Instagram
}

// Structured script content from AI generation
export interface StructuredScriptContent {
  style: string
  tone_instructions?: string
  visual_cues: string[]
  voiceover: string[]
  text_overlay?: string[]
  music_recommendation?: string
  hashtags?: string
  background_content_suggestions?: string[]
  audio_design?: string[]
  pacing_and_editing?: string[]
  lighting_and_composition?: string[]
  filming_guidelines?: string[]
  transition_effects?: string[]
  color_grading?: string
  aspect_ratio?: string
}

export interface ScriptGenerationRequest {
  title: string
  description: string
  style: string
  duration: string
}

export interface ScriptGenerationResponse {
  ugcContent: UGCContent
  // Backward compatibility fields
  script: string
  title: string
  caption: string
  description: string
  aspectRatio: string
}

export interface VideoGenerationRequest {
  script?: string // For backward compatibility
  imageUrls: string[]
  aspectRatio?: string
  title?: string
  description?: string
  ugcContent?: UGCContent // New structured format
  style?: string // Video style format (e.g., 'ugc', 'green_screen', 'pas_framework', 'asmr_visual', 'before_after')
  duration?: string // Video duration ('10s' or '15s')
  structuredScript?: StructuredScriptContent
}