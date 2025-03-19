/**
 * Centralized color theme utility for consistent styling across the application
 */

// Status badge colors - Slate grayscale scheme
export const getStatusColor = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-slate-700 text-white hover:bg-slate-800';
    case 'pending':
    case 'todo':
      return 'bg-slate-500 text-white hover:bg-slate-600';
    case 'in_progress':
    case 'processing':
      return 'bg-slate-700 text-white hover:bg-slate-800';
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'canceled':
      return 'bg-slate-900 text-white hover:bg-slate-950';
    default:
      return 'bg-slate-400 text-black hover:bg-slate-500';
  }
};

// Priority/risk level badge colors - Red to teal gradient scheme
export const getPriorityColor = (priority: string | undefined): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-500 text-white hover:bg-red-600';
    case 'medium':
      return 'bg-orange-500 text-white hover:bg-orange-600';
    case 'low':
      return 'bg-amber-500 text-white hover:bg-amber-600';
    default:
      return 'bg-teal-500 text-white hover:bg-teal-600';
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

// Model/document type colors - Using exact Microsoft Office brand colors
export const getLabelColor = (label: string | undefined): string => {
  switch (label?.toLowerCase()) {
    case 'model':
      return '#0D7239'; // Microsoft Excel green
    case 'document':
      return '#1A5CBD'; // Microsoft Word blue
    case 'doc':
      return '#1A5CBD'; // Microsoft Word blue
    case 'presentation':
      return '#D04423'; // Microsoft PowerPoint orange/red
    case 'deck':
      return '#D04423'; // Microsoft PowerPoint orange/red
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

// Get status badge variant for shadcn components
export const getStatusVariant = (status: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return "secondary";
    case 'in_progress':
      return "default";
    case 'completed':
      return "default";
    case 'error':
    case 'failed':
      return "destructive";
    case 'cancelled':
      return "outline";
    default:
      return "outline";
  }
}; 