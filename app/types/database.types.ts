// Generated from all isolated PostgreSQL migrations by yarn db:generate.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Database = {
  naruto_spiritism: {
    Tables: {
      cast_events: {
        Row: {
          user_id: string
          request_id: string
          jutsu_id: string
          newly_unlocked: Json
          created_at: string
        }
        Insert: {
          user_id: string
          request_id: string
          jutsu_id: string
          newly_unlocked?: Json
          created_at?: string
        }
        Update: {
          user_id?: string
          request_id?: string
          jutsu_id?: string
          newly_unlocked?: Json
          created_at?: string
        }
        Relationships: []
      }
      jutsu_seals: {
        Row: { jutsu_id: string; position: number; seal_id: string }
        Insert: { jutsu_id: string; position: number; seal_id: string }
        Update: { jutsu_id?: string; position?: number; seal_id?: string }
        Relationships: []
      }
      jutsus: {
        Row: {
          id: string
          name: string
          short_name: string
          category: string
          description: string
          attack_power: number
          color: string
          duration: number
          cover: string
          effect: string | null
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          short_name: string
          category: string
          description: string
          attack_power: number
          color: string
          duration: number
          cover: string
          effect?: string | null
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          category?: string
          description?: string
          attack_power?: number
          color?: string
          duration?: number
          cover?: string
          effect?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      ninja_unlock_jutsus: {
        Row: { ninja_id: string; position: number; jutsu_id: string }
        Insert: { ninja_id: string; position: number; jutsu_id: string }
        Update: { ninja_id?: string; position?: number; jutsu_id?: string }
        Relationships: []
      }
      ninjas: {
        Row: {
          id: string
          name: string
          image: string
          unlock_kind: string
          required_count: number | null
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          image: string
          unlock_kind: string
          required_count?: number | null
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          image?: string
          unlock_kind?: string
          required_count?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          companion_id: string
          state_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          companion_id?: string
          state_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          companion_id?: string
          state_version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      seals: {
        Row: {
          id: string
          name: string
          animal: string
          reading: string
          image: string
          hint: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          animal: string
          reading: string
          image: string
          hint: string
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          animal?: string
          reading?: string
          image?: string
          hint?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_jutsu_progress: {
        Row: { user_id: string; jutsu_id: string; casts: number; last_cast_at: string }
        Insert: { user_id: string; jutsu_id: string; casts: number; last_cast_at: string }
        Update: { user_id?: string; jutsu_id?: string; casts?: number; last_cast_at?: string }
        Relationships: []
      }
      user_ninja_unlocks: {
        Row: { user_id: string; ninja_id: string; unlocked_at: string }
        Insert: { user_id: string; ninja_id: string; unlocked_at?: string }
        Update: { user_id?: string; ninja_id?: string; unlocked_at?: string }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      get_catalog: { Args: Record<never, never>; Returns: Json }
      get_my_state: { Args: Record<never, never>; Returns: Json }
      record_cast: { Args: { jutsu_id: string; request_id: string }; Returns: Json }
      select_companion: { Args: { ninja_id: string }; Returns: Json }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
