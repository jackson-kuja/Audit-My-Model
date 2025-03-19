export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  preferred_email?: string;
  is_paid?: boolean;
  subscription_status?: string;
  subscription_end_date?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface Audit {
  id: string;
  user_id: string;
  name: string;
  model_name?: string;
  model_type?: string;
  description?: string;
  file_path?: string;
  audit_type?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'failed' | 'cancelled';
  score: number | null;
  risk_score?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  original_filename?: string;
  file_size_bytes?: number;
  upload_timestamp?: string;
  error_message?: string;
  results?: any;
  audit_result?: string;
  summary?: string;
}

// Function to map database status to display-friendly status
export function mapStatusForDisplay(status: Audit['status']): string {
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

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval?: string;
  description: string;
  features: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  is_paid: boolean;
  subscription_start_date: string;
  subscription_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (info: Partial<User>) => Promise<void>;
}

export interface AuditResult {
  score?: number;
  summary?: string;
  findings?: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
} 