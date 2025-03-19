import React from 'react';
import { Task } from '../../pages/Dashboard';
import { useNavigate } from 'react-router-dom';
import { Badge } from "../ui/badge";

// Lucide icons
import {
  CheckCircle,
  Clock,
  HelpCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from "lucide-react";

// Status icon mapping
function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'processing':
    case 'in progress':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'todo':
    case 'pending':
      return <HelpCircle className="h-4 w-4 text-amber-500" />;
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'canceled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
  }
}

// Priority icon mapping
function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return <ChevronUp className="h-4 w-4 text-red-500" />;
    case 'medium':
      return <ChevronRight className="h-4 w-4 text-amber-500" />;
    case 'low':
      return <ChevronDown className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
}

// Get badge variant for status
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case 'completed':
      return "default";
    case 'pending':
    case 'todo':
      return "secondary";
    case 'in progress':
    case 'processing':
      return "outline";
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'canceled':
      return "destructive";
    default:
      return "outline";
  }
}

// Get badge variant for priority
function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority.toLowerCase()) {
    case 'high':
      return "destructive";
    case 'medium':
      return "secondary";
    case 'low':
      return "default";
    default:
      return "outline";
  }
}

// Component for clickable row cell
const ClickableCell = ({ row, children }: { row: Task; children: React.ReactNode }) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/audit/${row.id}`);
  };
  
  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer font-medium hover:underline text-primary"
    >
      {children}
    </div>
  );
};

// These are just mock definitions for the table columns
export const columns = [
  {
    id: 'title',
    label: 'Name',
    minWidth: 250,
    align: 'left' as const,
    render: (row: Task) => (
      <ClickableCell row={row}>
        <div className="flex items-center gap-2">
          <span>{row.title}</span>
        </div>
      </ClickableCell>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    minWidth: 120,
    align: 'left' as const,
    render: (row: Task) => (
      <div className="flex items-center gap-2">
        {getStatusIcon(row.status)}
        <Badge variant={getStatusVariant(row.status)}>
          {row.status}
        </Badge>
      </div>
    ),
  },
  {
    id: 'label',
    label: 'Type',
    minWidth: 120,
    align: 'left' as const,
    render: (row: Task) => (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground" 
        style={{ backgroundColor: getLabelColor(row.label), color: '#fff' }}
      >
        {row.label}
      </span>
    ),
  },
  {
    id: 'priority',
    label: 'Risk Level',
    minWidth: 120,
    align: 'left' as const,
    render: (row: Task) => (
      <div className="flex items-center gap-2">
        {getPriorityIcon(row.priority)}
        <Badge variant={getPriorityVariant(row.priority)}>
          {row.priority}
        </Badge>
      </div>
    ),
  },
];

// Helper function to get color for label chip
function getLabelColor(label: string): string {
  switch (label.toLowerCase()) {
    case 'model':
      return '#3f51b5'; // Indigo
    case 'data':
      return '#2196f3'; // Blue
    case 'security':
      return '#f44336'; // Red
    case 'performance':
      return '#ff9800'; // Orange
    default:
      return '#757575'; // Grey
  }
} 