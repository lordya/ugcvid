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
      cron_job_logs: {
        Row: {
          executed_at: string | null
          id: number
          job_name: string
          message: string | null
          status: string
        }
        Insert: {
          executed_at?: string | null
          id?: number
          job_name: string
          message?: string | null
          status: string
        }
        Update: {
          executed_at?: string | null
          id?: number
          job_name?: string
          message?: string | null
          status?: string
        }
        Relationships: []
      }
      generation_analytics: {
        Row: {
          circuit_breaker_state: string | null
          completed_at: string | null
          cost_credits: number
          cost_usd: number | null
          created_at: string | null
          duration: number
          enhanced_prompts: boolean | null
          error_reason: string | null
          format: string
          generation_time_seconds: number | null
          id: string
          model: string
          quality_tier: Database["public"]["Enums"]["user_quality_tier"] | null
          retry_count: number | null
          status: string
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          circuit_breaker_state?: string | null
          completed_at?: string | null
          cost_credits: number
          cost_usd?: number | null
          created_at?: string | null
          duration: number
          enhanced_prompts?: boolean | null
          error_reason?: string | null
          format: string
          generation_time_seconds?: number | null
          id?: string
          model: string
          quality_tier?: Database["public"]["Enums"]["user_quality_tier"] | null
          retry_count?: number | null
          status: string
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          circuit_breaker_state?: string | null
          completed_at?: string | null
          cost_credits?: number
          cost_usd?: number | null
          created_at?: string | null
          duration?: number
          enhanced_prompts?: boolean | null
          error_reason?: string | null
          format?: string
          generation_time_seconds?: number | null
          id?: string
          model?: string
          quality_tier?: Database["public"]["Enums"]["user_quality_tier"] | null
          retry_count?: number | null
          status?: string
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_analytics_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      model_prompts: {
        Row: {
          created_at: string
          duration: string
          guidelines: Json | null
          id: string
          is_active: boolean | null
          kie_api_model_name: string
          model_config: Json | null
          model_id: string
          model_name: string
          negative_prompts: Json | null
          quality_instructions: string | null
          style: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration: string
          guidelines?: Json | null
          id?: string
          is_active?: boolean | null
          kie_api_model_name: string
          model_config?: Json | null
          model_id: string
          model_name: string
          negative_prompts?: Json | null
          quality_instructions?: string | null
          style: string
          system_prompt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: string
          guidelines?: Json | null
          id?: string
          is_active?: boolean | null
          kie_api_model_name?: string
          model_config?: Json | null
          model_id?: string
          model_name?: string
          negative_prompts?: Json | null
          quality_instructions?: string | null
          style?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      script_angles: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          keywords: string[]
          label: string
          prompt_template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          is_active?: boolean | null
          keywords: string[]
          label: string
          prompt_template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          label?: string
          prompt_template?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          provider: Database["public"]["Enums"]["social_provider"]
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
          auto_regenerate_on_low_quality: boolean
          avatar_url: string | null
          banned: boolean
          created_at: string
          credits_balance: number
          display_name: string | null
          email: string
          id: string
          preferences: Json
          quality_tier: Database["public"]["Enums"]["user_quality_tier"]
          role: string
          updated_at: string
        }
        Insert: {
          auto_regenerate_on_low_quality?: boolean
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          email: string
          id: string
          preferences?: Json
          quality_tier?: Database["public"]["Enums"]["user_quality_tier"]
          role?: string
          updated_at?: string
        }
        Update: {
          auto_regenerate_on_low_quality?: boolean
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          email?: string
          id?: string
          preferences?: Json
          quality_tier?: Database["public"]["Enums"]["user_quality_tier"]
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
      video_scripts: {
        Row: {
          angle_id: string
          content: string
          created_at: string
          id: string
          is_selected: boolean | null
          video_id: string
        }
        Insert: {
          angle_id: string
          content: string
          created_at?: string
          id?: string
          is_selected?: boolean | null
          video_id: string
        }
        Update: {
          angle_id?: string
          content?: string
          created_at?: string
          id?: string
          is_selected?: boolean | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_scripts_angle_id_fkey"
            columns: ["angle_id"]
            isOneToOne: false
            referencedRelation: "script_angles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_scripts_video_id_fkey"
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
          quality_issues: Json | null
          quality_score: number | null
          quality_validated_at: string | null
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
          quality_issues?: Json | null
          quality_score?: number | null
          quality_validated_at?: string | null
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
          quality_issues?: Json | null
          quality_score?: number | null
          quality_validated_at?: string | null
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
      v_credit_consumption_daily: {
        Row: {
          credits_bonused: number | null
          credits_consumed: number | null
          credits_purchased: number | null
          credits_refunded: number | null
          date: string | null
        }
        Relationships: []
      }
      v_format_performance_daily: {
        Row: {
          avg_cost_credits: number | null
          avg_generation_time_seconds: number | null
          date: string | null
          failed_attempts: number | null
          format: string | null
          success_rate_percent: number | null
          successful_attempts: number | null
          total_attempts: number | null
        }
        Relationships: []
      }
      v_model_performance_daily: {
        Row: {
          avg_cost_credits: number | null
          avg_cost_usd: number | null
          avg_generation_time_seconds: number | null
          avg_retry_count: number | null
          date: string | null
          failed_attempts: number | null
          model: string | null
          success_rate_percent: number | null
          successful_attempts: number | null
          total_attempts: number | null
        }
        Relationships: []
      }
      v_revenue_daily: {
        Row: {
          avg_purchase_amount: number | null
          credits_revenue: number | null
          date: string | null
          purchase_transactions: number | null
          usd_revenue: number | null
        }
        Relationships: []
      }
      v_user_activity_daily: {
        Row: {
          active_users: number | null
          avg_cost_per_video: number | null
          avg_generation_time_seconds: number | null
          date: string | null
          users_with_completed_videos: number | null
          videos_completed: number | null
          videos_created: number | null
        }
        Relationships: []
      }
      v_user_growth_daily: {
        Row: {
          date: string | null
          new_admins: number | null
          new_users: number | null
        }
        Relationships: []
      }
      v_video_generation_daily: {
        Row: {
          completed_videos: number | null
          date: string | null
          failed_videos: number | null
          processing_videos: number | null
          success_rate_percent: number | null
          total_videos: number | null
        }
        Relationships: []
      }
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
      call_social_analytics_cron: { Args: never; Returns: undefined }
      decrypt_token: { Args: { encrypted_token: string }; Returns: string }
      delete_batch_item_with_refund: {
        Args: { p_batch_id: string; p_item_id: string; p_user_id: string }
        Returns: undefined
      }
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
      log_social_analytics_cron: { Args: never; Returns: undefined }
      update_video_performer_status: {
        Args: { video_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      payment_provider: "LEMON" | "CRYPTO" | "SYSTEM" | "KIE_AI"
      social_provider: "TIKTOK" | "YOUTUBE" | "INSTAGRAM"
      transaction_type: "PURCHASE" | "GENERATION" | "REFUND" | "BONUS"
      user_quality_tier: "standard" | "premium"
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
      user_quality_tier: ["standard", "premium"],
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
  technical_directives?: {
    lighting?: string
    camera?: string
    consistency?: string
  }
  narrative_arc?: string[]
  cinematic_techniques?: string[]
}

export interface ScriptGenerationRequest {
  title: string
  description: string
  style: string
  duration: string
  language?: string // Optional language code (e.g., 'en', 'es', 'fr'). Defaults to 'en' if not provided.
  video_id?: string // Optional video ID for script generation
  manual_angle_ids?: string[] // Optional manual angle selection
}

export interface ScriptGenerationResponse {
  ugcContent?: UGCContent
  scriptContent?: StructuredScriptContent
  // Backward compatibility fields
  script: string
  title: string
  caption?: string
  description: string
  aspectRatio?: string
  // Model-aware script generation fields
  model?: {
    id: string
    name: string
    maxDuration: number
    supportedAspectRatios: string[]
    capabilities: string[]
    bestPractices: string[]
    constraints: string[]
    useCases: string[]
    pricing?: {
      perSecond: number
      creditsPerSecond?: number
    }
  }
  validation?: {
    isValid: boolean
    warnings: string[]
    suggestions: string[]
    estimatedDuration: number
  }
}

export interface AdvancedScriptGenerationResponse {
  scripts: Array<{
    angle: {
      id: string
      label: string
      description: string
    }
    content: string
    confidence: number
  }>
  selectedScript?: {
    angle: {
      id: string
      label: string
      description: string
    }
    content: string
    confidence: number
  }
  // Backward compatibility fields
  script: string
  title: string
  caption?: string
  description: string
  aspectRatio?: string
  // Model-aware script generation fields
  model?: {
    id: string
    name: string
    maxDuration: number
    supportedAspectRatios: string[]
    capabilities: string[]
    bestPractices: string[]
    constraints: string[]
    useCases: string[]
    pricing?: {
      perSecond: number
      creditsPerSecond?: number
    }
  }
  validation?: {
    isValid: boolean
    warnings: string[]
    suggestions: string[]
    estimatedDuration: number
  }
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