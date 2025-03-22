/**
 * Task interface for dashboard display
 */

export interface Task {
  id: string;
  title: string;
  status: string;
  label: string;
  priority: string;
  created_at: string;
  locked?: boolean;
} 