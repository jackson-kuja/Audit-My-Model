/**
 * Centralized color theme utility for consistent styling across the application
 */

// Status badge colors - Teal color scheme
export const getStatusColor = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-teal-600 text-white hover:bg-teal-700';
    case 'pending':
    case 'todo':
      return 'bg-teal-400 text-black hover:bg-teal-500';
    case 'in_progress':
    case 'processing':
      return 'bg-teal-500 text-white hover:bg-teal-600';
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'canceled':
      return 'bg-teal-800 text-white hover:bg-teal-900';
    default:
      return 'bg-teal-300 text-black hover:bg-teal-400';
  }
};

// Priority/risk level badge colors - Violet color scheme
export const getPriorityColor = (priority: string | undefined): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-violet-700 text-white hover:bg-violet-800';
    case 'medium':
      return 'bg-violet-500 text-white hover:bg-violet-600';
    case 'low':
      return 'bg-violet-300 text-black hover:bg-violet-400';
    default:
      return 'bg-violet-200 text-black hover:bg-violet-300';
  }
};

// Severity badge colors - Rose color scheme
export const getSeverityColor = (severity: string | undefined): string => {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 'bg-rose-600 text-white hover:bg-rose-700';
    case 'medium':
      return 'bg-rose-400 text-white hover:bg-rose-500';
    case 'low':
      return 'bg-rose-200 text-black hover:bg-rose-300';
    default:
      return 'bg-rose-100 text-black hover:bg-rose-200';
  }
};

// Model/document type colors - Mixed color scheme
export const getLabelColor = (label: string | undefined): string => {
  switch (label?.toLowerCase()) {
    case 'model':
      return '#8b5cf6'; // Violet-500
    case 'document':
      return '#3b82f6'; // Blue-500
    case 'presentation':
      return '#f97316'; // Orange-500
    case 'data':
      return '#10b981'; // Emerald-500
    case 'security':
      return '#ef4444'; // Red-500
    case 'performance':
      return '#8b5cf6'; // Violet-500
    default:
      return '#6b7280'; // Gray-500
  }
};

// Risk score color function - tailwind classes for circular display
export const getRiskScoreColor = (score: number | undefined): string => {
  if (!score && score !== 0) return 'bg-gray-400';
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-600';
};

// Material UI specific risk score color (hex)
export const getRiskScoreHexColor = (score: number | undefined): string => {
  if (!score && score !== 0) return '#9ca3af'; // gray-400
  if (score >= 80) return '#10b981'; // emerald-500
  if (score >= 60) return '#f59e0b'; // amber-500
  return '#e11d48'; // rose-600
}; 