/**
 * Supabase Database Types
 * 
 * Generated and refactored for the Event Management Platform.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone_number: string | null
          bio: string | null
          profile_pic_url: string | null
          user_type: 'STUDENT' | 'PROFESSIONAL'
          is_super_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone_number?: string | null
          bio?: string | null
          profile_pic_url?: string | null
          user_type: 'STUDENT' | 'PROFESSIONAL'
          is_super_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone_number?: string | null
          bio?: string | null
          profile_pic_url?: string | null
          user_type?: 'STUDENT' | 'PROFESSIONAL'
          is_super_admin?: boolean
          created_at?: string
        }
      }
      student_profiles: {
        Row: {
          user_id: string
          institute_name: string
          student_id_number: string | null
          course_name: string | null
        }
        Insert: {
          user_id: string
          institute_name: string
          student_id_number?: string | null
          course_name?: string | null
        }
        Update: {
          user_id?: string
          institute_name?: string
          student_id_number?: string | null
          course_name?: string | null
        }
      }
      professional_profiles: {
        Row: {
          user_id: string
          company_name: string
          designation: string | null
          linkedin_url: string | null
          is_verified: boolean
        }
        Insert: {
          user_id: string
          company_name: string
          designation?: string | null
          linkedin_url?: string | null
          is_verified?: boolean
        }
        Update: {
          user_id?: string
          company_name?: string
          designation?: string | null
          linkedin_url?: string | null
          is_verified?: boolean
        }
      }
      user_connections: {
        Row: {
          id: number
          follower_id: string | null
          followed_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          follower_id?: string | null
          followed_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          follower_id?: string | null
          followed_id?: string | null
          status?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: number
          owner_id: string | null
          parent_event_id: number | null
          title: string
          description: string | null
          venue: string | null
          start_time: string
          end_time: string
          is_invite_only: boolean
          is_volunteer_open: boolean
        }
        Insert: {
          id?: number
          owner_id?: string | null
          parent_event_id?: number | null
          title: string
          description?: string | null
          venue?: string | null
          start_time: string
          end_time: string
          is_invite_only?: boolean
          is_volunteer_open?: boolean
        }
        Update: {
          id?: number
          owner_id?: string | null
          parent_event_id?: number | null
          title?: string
          description?: string | null
          venue?: string | null
          start_time?: string
          end_time?: string
          is_invite_only?: boolean
          is_volunteer_open?: boolean
        }
      }
      event_registrations: {
        Row: {
          reg_id: number
          event_id: number | null
          user_id: string | null
          ticket_hash: string
          is_checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          registered_at: string
        }
        Insert: {
          reg_id?: number
          event_id?: number | null
          user_id?: string | null
          ticket_hash?: string
          is_checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          registered_at?: string
        }
        Update: {
          reg_id?: number
          event_id?: number | null
          user_id?: string | null
          ticket_hash?: string
          is_checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          registered_at?: string
        }
      }
      event_team: {
        Row: {
          id: number
          event_id: number | null
          user_id: string | null
          role: 'ORGANIZER' | 'VOLUNTEER'
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          can_scan_qr: boolean
          can_manage_tasks: boolean
          assigned_by: string | null
        }
        Insert: {
          id?: number
          event_id?: number | null
          user_id?: string | null
          role: 'ORGANIZER' | 'VOLUNTEER'
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          can_scan_qr?: boolean
          can_manage_tasks?: boolean
          assigned_by?: string | null
        }
        Update: {
          id?: number
          event_id?: number | null
          user_id?: string | null
          role?: 'ORGANIZER' | 'VOLUNTEER'
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          can_scan_qr?: boolean
          can_manage_tasks?: boolean
          assigned_by?: string | null
        }
      }
      master_tags: {
        Row: {
          id: number
          tag_name: string
        }
        Insert: {
          id?: number
          tag_name: string
        }
        Update: {
          id?: number
          tag_name?: string
        }
      }
      user_interests: {
        Row: {
          user_id: string
          tag_id: number
        }
        Insert: {
          user_id: string
          tag_id: number
        }
        Update: {
          user_id?: string
          tag_id?: number
        }
      }
      event_tags: {
        Row: {
          event_id: number
          tag_id: number
        }
        Insert: {
          event_id: number
          tag_id: number
        }
        Update: {
          event_id?: number
          tag_id?: number
        }
      }
    }
    Views: {
      profile_view: {
        Row: {
          id: string
          name: string
          email: string
          phone_number: string | null
          bio: string | null
          profile_pic_url: string | null
          user_type: 'STUDENT' | 'PROFESSIONAL'
          is_super_admin: boolean
          created_at: string
          profile_details: Json
          interests: string[]
        }
      }
      agenda_view: {
        Row: {
          id: string
          title: string
          description: string | null
          speaker: string | null
          speakerTitle: string
          time: string
          duration: string
          location: string | null
          track: string
          tags: string[]
          isRecommended: boolean
          isInAgenda: boolean
        }
      }
      networking_view: {
        Row: {
          id: string
          name: string
          title: string
          company: string
          location: string
          bio: string | null
          interests: string[]
          matchPercentage: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type_enum: 'STUDENT' | 'PROFESSIONAL'
      team_role_enum: 'ORGANIZER' | 'VOLUNTEER'
      team_status_enum: 'PENDING' | 'APPROVED' | 'REJECTED'
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type StudentProfile = Database['public']['Tables']['student_profiles']['Row']
export type ProfessionalProfile = Database['public']['Tables']['professional_profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row']
export type EventTeamMember = Database['public']['Tables']['event_team']['Row']
export type MasterTag = Database['public']['Tables']['master_tags']['Row']
export type ProfileView = Database['public']['Views']['profile_view']['Row']
export type AgendaView = Database['public']['Views']['agenda_view']['Row']
export type NetworkingView = Database['public']['Views']['networking_view']['Row']
export type ChatConversation = Database['public']['Tables']['chat_conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
