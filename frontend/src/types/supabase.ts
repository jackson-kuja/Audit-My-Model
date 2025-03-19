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
      audits: {
        Row: {
          id: string
          user_id: string
          name: string
          model_name?: string
          description?: string
          status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'error'
          score: number | null
          risk_score?: number | null
          created_at: string
          updated_at: string
          completed_at?: string
          error_message?: string
          model_type?: string
          file_path?: string
          audit_type?: string
          original_filename?: string
          summary?: string
          upload_timestamp?: string
          file_size_bytes?: number
          audit_result?: string
          results?: Json
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          model_name?: string
          description?: string
          status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'error'
          score?: number | null
          risk_score?: number | null
          created_at?: string
          updated_at?: string
          completed_at?: string
          error_message?: string
          model_type?: string
          file_path?: string
          audit_type?: string
          original_filename?: string
          summary?: string
          upload_timestamp?: string
          file_size_bytes?: number
          audit_result?: string
          results?: Json
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          model_name?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'error'
          score?: number | null
          risk_score?: number | null
          created_at?: string
          updated_at?: string
          completed_at?: string
          error_message?: string
          model_type?: string
          file_path?: string
          audit_type?: string
          original_filename?: string
          summary?: string
          upload_timestamp?: string
          file_size_bytes?: number
          audit_result?: string
          results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          is_paid: boolean
          first_name?: string
          last_name?: string
          preferred_email?: string
          subscription_status?: string
          subscription_end_date?: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          is_paid?: boolean
          first_name?: string
          last_name?: string
          preferred_email?: string
          subscription_status?: string
          subscription_end_date?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          is_paid?: boolean
          first_name?: string
          last_name?: string
          preferred_email?: string
          subscription_status?: string
          subscription_end_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 