import { Session } from '@supabase/supabase-js';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  preferred_email?: string;
  is_paid?: boolean;
  user_tier?: 'free' | 'paid';
  subscription_status?: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    user_tier?: 'free' | 'paid';
  };
  app_metadata?: any;
  aud?: string;
}

export type AuditStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'error';

export interface Audit {
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
  status: AuditStatus;
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
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

export type ProgressEvent = {
  loaded: number;
  total: number;
};

export interface FileUploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  location?: string;
  created_at: string;
  title?: string;
  line_number?: number;
  file_path?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  is_paid?: boolean;
}

export interface AuditResult {
  score?: number;
  summary?: string;
  findings?: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations?: string[];
}

// Export Task type
export type { Task } from './task';

// Function to map database status to display-friendly status
export function mapStatusForDisplay(status: AuditStatus): string {
  switch (status) {
    case 'in_progress':
      return 'Processing';
    case 'error':
      return 'Failed';
    case 'pending':
    case 'completed':
    case 'failed':
    case 'cancelled':
      return status.charAt(0).toUpperCase() + status.slice(1);
    default:
      return 'Pending';
  }
} 