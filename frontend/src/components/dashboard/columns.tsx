import React, { useState } from 'react';
import { Task } from '../../types/index';
import { useNavigate } from 'react-router-dom';
import { Badge } from "../ui/badge";
import { 
  getStatusColor, 
  getPriorityColor,
  getLabelColor 
} from '../../utils/colorTheme';
import { formatDate } from '../../utils/dateUtils';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";

// Calculate hours remaining until audit unlocks (24 hours from creation)
const getHoursRemaining = (createdAt: string): number => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const hoursPassed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, 24 - hoursPassed);
  return Math.ceil(hoursRemaining); // Round up for better UX
};

// Component for clickable row cell
const ClickableCell = ({ row, children }: { row: Task; children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (row.locked) {
      setTooltipOpen(true); // Just show tooltip for locked audits
    } else {
      navigate(`/audit/${row.id}`);
    }
  };
  
  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/profile?tab=subscription');
  };
  
  if (!row.locked) {
    return (
      <div 
        onClick={handleClick}
        className="cursor-pointer font-medium hover:underline text-primary"
      >
        {children}
      </div>
    );
  }
  
  // If locked, wrap with tooltip
  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <div 
            className="cursor-not-allowed opacity-70 flex items-center gap-2"
            onClick={handleClick}
          >
            <Lock size={16} className="text-muted-foreground" />
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-52 p-2" side="left" sideOffset={5} delayDuration={100} align="start">
          <div className="space-y-1">
            <p className="font-medium text-center">Unlocks in {getHoursRemaining(row.created_at)} Hours</p>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full mt-1"
              onClick={handleUpgradeClick}
            >
              Get Access Now
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
            {row.locked && " • Unlocks in " + getHoursRemaining(row.created_at) + " Hours"}
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
        <Badge className={`${getStatusColor(row.locked ? 'locked' : row.status)} rounded-md`}>
          {row.locked ? 'locked' : row.status.toLowerCase()}
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
        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" 
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
        <Badge className={`${getPriorityColor(row.priority)} rounded-md`}>
          {row.priority.toLowerCase()}
        </Badge>
      </div>
    ),
  },
]; 