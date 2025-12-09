export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectType = 'personal' | 'partner' | 'client'
export type ToolType = 'triangle' | 't1-email' | 'subject-lines' | 'cap'
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          subscription_tier: SubscriptionTier
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: SubscriptionTier
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: SubscriptionTier
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          type: ProjectType
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: ProjectType
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: ProjectType
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      voice_dna: {
        Row: {
          id: string
          project_id: string
          name: string
          file_url: string
          file_name: string
          content_text: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          file_url: string
          file_name: string
          content_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          file_url?: string
          file_name?: string
          content_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      offer_contexts: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          content_json: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          content_json?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          content_json?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      outputs: {
        Row: {
          id: string
          project_id: string
          folder_id: string | null
          tool_type: ToolType
          output_subtype: string | null
          title: string | null
          content: Json
          input_context: Json | null
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          folder_id?: string | null
          tool_type: ToolType
          output_subtype?: string | null
          title?: string | null
          content: Json
          input_context?: Json | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          folder_id?: string | null
          tool_type?: ToolType
          output_subtype?: string | null
          title?: string | null
          content?: Json
          input_context?: Json | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          project_id: string
          parent_id: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          parent_id?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_type: ProjectType
      tool_type: ToolType
      subscription_tier: SubscriptionTier
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type VoiceDNA = Database['public']['Tables']['voice_dna']['Row']
export type OfferContext = Database['public']['Tables']['offer_contexts']['Row']
export type Output = Database['public']['Tables']['outputs']['Row']
export type Folder = Database['public']['Tables']['folders']['Row']

// Extended types with relations
export type ProjectWithContext = Project & {
  voice_dna: VoiceDNA[]
  offer_contexts: OfferContext[]
}
