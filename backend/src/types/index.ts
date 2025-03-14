export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_paid: boolean;
  subscription_end_date?: string;
}

export interface Audit {
  id: string;
  user_id: string;
  model_name: string;
  model_type?: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  score?: number;
  results?: any;
  original_filename?: string;
  file_size_bytes?: number;
  file_mime_type?: string;
  upload_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAuditRequest {
  model_name: string;
  model_type?: string;
  description?: string;
  file?: File;
}

export interface UpdateAuditRequest {
  model_name?: string;
  model_type?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'error';
  score?: number;
  results?: any;
}

export interface ErrorResponse {
  error: string;
  status: number;
}

export interface AuthResponse {
  user: User | null;
  session: any | null;
  error: string | null;
} 