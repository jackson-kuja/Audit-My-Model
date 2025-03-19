import React from 'react';
import { Task } from '../../types/index';
import { useNavigate } from 'react-router-dom';
import { Badge } from "../ui/badge";
import { 
  getStatusColor, 
  getPriorityColor,
  getLabelColor 
} from '../../utils/colorTheme';
import { formatDate } from '../../utils/dateUtils';

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
        <div className="flex flex-col">
          <span>{row.title}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(row.created_at)}
          </span>
        </div>
      </ClickableCell>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    minWidth: 120,
    align: 'center' as const,
    render: (row: Task) => (
      <div className="flex items-center justify-center">
        <Badge className={getStatusColor(row.status)}>
          {row.status.toLowerCase()}
        </Badge>
      </div>
    ),
  },
  {
    id: 'label',
    label: 'Type',
    minWidth: 120,
    align: 'center' as const,
    render: (row: Task) => (
      <div className="flex justify-center">
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" 
          style={{ backgroundColor: getLabelColor(row.label), color: '#fff' }}
        >
          {row.label.toLowerCase()}
        </span>
      </div>
    ),
  },
  {
    id: 'priority',
    label: 'Risk Level',
    minWidth: 120,
    align: 'center' as const,
    render: (row: Task) => (
      <div className="flex items-center justify-center">
        <Badge className={getPriorityColor(row.priority)}>
          {row.priority.toLowerCase()}
        </Badge>
      </div>
    ),
  },
]; 