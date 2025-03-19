import { format } from "date-fns";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  ExternalLink,
  Download,
  FileText,
  BarChart,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { MailItem } from "./mail-dashboard";

interface MailDisplayProps {
  mail: MailItem | null;
  onViewDetails: (id: string) => void;
}

export function MailDisplay({ mail, onViewDetails }: MailDisplayProps) {
  if (!mail) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No audit selected
      </div>
    );
  }

  const audit = mail.audit || {};
  const riskScore = audit.risk_score || audit.score || 0;
  const scoreColor = riskScore > 7 ? "text-destructive" : riskScore > 4 ? "text-amber-500" : "text-green-500";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onViewDetails(mail.id)}>
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View Details</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Full Details</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
                <span className="sr-only">Download Report</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download Report</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <FileText className="h-4 w-4" />
                <span className="sr-only">View Report</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Report</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <BarChart className="h-4 w-4" />
                <span className="sr-only">View Analytics</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Analytics</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Reply className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star audit</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Archive audit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Avatar>
              <AvatarImage alt={mail.name} />
              <AvatarFallback>
                {mail.name
                  .split(" ")
                  .map((chunk) => chunk[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <div className="font-semibold">{mail.name}</div>
              <div className="line-clamp-1 text-xs">{mail.subject}</div>
              <div className="line-clamp-1 text-xs">
                <span className="font-medium">Model:</span> {mail.email}
              </div>
              {audit.model_type && (
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Type:</span> {
                    audit.model_type.toLowerCase() === 'excel' ? 'Excel Model' : 
                    audit.model_type.toLowerCase() === 'word' ? 'Word Doc' :
                    audit.model_type.toLowerCase() === 'powerpoint' ? 'PowerPoint Deck' :
                    audit.model_type
                  }
                </div>
              )}
              {riskScore > 0 && (
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Risk Score:</span> <span className={scoreColor}>{riskScore}/10</span>
                </div>
              )}
            </div>
          </div>
          {mail.date && (
            <div className="ml-auto text-xs text-muted-foreground">
              {format(new Date(mail.date), "PPpp")}
            </div>
          )}
        </div>
        <Separator />
        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
          {mail.text}
        </div>
        <Separator className="mt-auto" />
        <div className="p-4">
          <Button 
            className="w-full" 
            onClick={() => onViewDetails(mail.id)}
          >
            View Full Audit Details
          </Button>
        </div>
      </div>
    </div>
  );
} 