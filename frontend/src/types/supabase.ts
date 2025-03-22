// Define database schema types for Supabase
export type Database = {
  public: {
    Tables: {
      audits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          model_name?: string;
          model_type?: string;
          description?: string;
          file_path?: string;
          audit_type?: string;
          results?: any;
          original_filename?: string;
          status: string;
          created_at: string;
          updated_at: string;
          completed_at?: string;
          risk_score?: number;
          score?: number;
          summary?: string;
          audit_result?: string;
          error_message?: string;
          file_size_bytes?: number;
          upload_timestamp?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          model_name?: string;
          model_type?: string;
          description?: string;
          file_path?: string;
          audit_type?: string;
          results?: any;
          original_filename?: string;
          status: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string;
          risk_score?: number;
          score?: number;
          summary?: string;
          audit_result?: string;
          error_message?: string;
          file_size_bytes?: number;
          upload_timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          model_name?: string;
          model_type?: string;
          description?: string;
          file_path?: string;
          audit_type?: string;
          results?: any;
          original_filename?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string;
          risk_score?: number;
          score?: number;
          summary?: string;
          audit_result?: string;
          error_message?: string;
          file_size_bytes?: number;
          upload_timestamp?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          is_paid: boolean;
          first_name?: string;
          last_name?: string;
          preferred_email?: string;
          subscription_status?: string;
          subscription_end_date?: string;
          stripe_customer_id?: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          is_paid?: boolean;
          first_name?: string;
          last_name?: string;
          preferred_email?: string;
          subscription_status?: string;
          subscription_end_date?: string;
          stripe_customer_id?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          is_paid?: boolean;
          first_name?: string;
          last_name?: string;
          preferred_email?: string;
          subscription_status?: string;
          subscription_end_date?: string;
          stripe_customer_id?: string;
        };
      };
      finding_statuses: {
        Row: {
          id: string;
          audit_id: string;
          finding_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          finding_id: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          finding_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

// Export an empty object to make this file a proper module
export {};
