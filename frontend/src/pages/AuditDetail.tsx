import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import { Audit, AuditResult } from '../types/index';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Unlock, Check, Clock, X, AlertCircle, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, LayoutGroup } from "framer-motion";
import findingService from '../services/findingService';

// Shadcn components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { toast } from "../hooks/use-toast";
import {
  getStatusColor,
  getPriorityColor
} from '../utils/colorTheme';

// Create a motion-wrapped Card component
const MotionCard = motion(Card);

// Define finding status type
type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

// Status options with icons and labels
const statusOptions = [
  {
    value: 'open',
    label: 'Open',
    icon: <AlertCircle className="h-3 w-3 mr-1" />
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: <Clock className="h-3 w-3 mr-1" />
  },
  {
    value: 'resolved',
    label: 'Resolved',
    icon: <Check className="h-3 w-3 mr-1" />
  },
  {
    value: 'ignored',
    label: 'Ignored',
    icon: <X className="h-3 w-3 mr-1" />
  }
];

interface AuditDetailProps {
  audit: Audit | null;
  loading: boolean;
  error: string | null;
}

// Status Selector Component
interface StatusSelectorProps {
  status: FindingStatus;
  onStatusChange: (status: FindingStatus) => void;
}

// Helper function to get status badge style
const getStatusBadgeClass = (status: FindingStatus) => {
  switch (status) {
    case 'resolved':
      return 'text-green-800 bg-green-100';
    case 'in_progress':
      return 'text-blue-800 bg-blue-100';
    case 'ignored':
      return 'text-gray-800 bg-gray-100';
    default: // open
      return 'text-yellow-800 bg-yellow-100';
  }
};

const StatusSelector: React.FC<StatusSelectorProps> = ({ status, onStatusChange }) => {
  return (
    <Select 
      value={status}
      onValueChange={(value) => onStatusChange(value as FindingStatus)}
    >
      <SelectTrigger 
        className={`w-auto min-h-6 h-6 text-xs border-0 px-2 py-0 ${getStatusBadgeClass(status)}`}
      >
        <SelectValue placeholder="Set status">
          <span className="flex items-center">
            {statusOptions.find(option => option.value === status)?.icon}
            {statusOptions.find(option => option.value === status)?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {statusOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
          >
            <span className="flex items-center">
              {option.icon}
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Findings List Component
interface FindingsListProps {
  results: AuditResult;
  findingStatuses: Record<string, FindingStatus>;
  updateFindingStatus: (findingId: string, status: FindingStatus) => void;
}

const FindingsList: React.FC<FindingsListProps> = ({ results, findingStatuses, updateFindingStatus }) => {
  if (!results || !results.findings) return null;

  // Get status priority for sorting (in_progress first, open second, resolved third, ignored last)
  const getStatusPriority = (status: FindingStatus): number => {
    switch (status) {
      case 'in_progress': return 0;
      case 'open': return 1;
      case 'resolved': return 2;
      case 'ignored': return 3;
      default: return 1; // Default to open priority
    }
  };
  
  // Create a sorted array of findings based on status
  const sortedFindings = [...results.findings].map((finding, index) => {
    const findingId = `finding-${index}`;
    const status = findingStatuses[findingId] || 'open';
    return { finding, index, status, id: findingId };
  }).sort((a, b) => {
    return getStatusPriority(a.status) - getStatusPriority(b.status);
  });

  return (
    <LayoutGroup>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedFindings.map(({ finding, index, status, id }) => {
          const isIgnored = status === 'ignored';
          
          return (
            <MotionCard 
              key={id}
              layoutId={id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                layout: { duration: 0.5, type: "spring", damping: 25 },
                opacity: { duration: 0.3 }
              }}
            >
              <CardHeader className="py-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-start gap-2">
                    <Badge 
                      className={`${getPriorityColor(finding.severity)} rounded-md`}
                    >
                      {finding.severity.toLowerCase()} risk
                    </Badge>
                    <CardTitle className={isIgnored ? 'text-gray-400' : ''}>
                      {finding.title}
                    </CardTitle>
                  </div>
                  <StatusSelector 
                    status={status} 
                    onStatusChange={(newStatus) => updateFindingStatus(id, newStatus)} 
                  />
                </div>
              </CardHeader>
              <CardContent className={`py-4 ${isIgnored ? 'text-gray-400 line-through opacity-70' : ''}`}>
                <p>{finding.description}</p>
              </CardContent>
            </MotionCard>
          );
        })}
      </div>
    </LayoutGroup>
  );
};

// Helper function to get status color for toast icon
const getStatusIconColor = (status: FindingStatus): string => {
  switch (status) {
    case 'resolved':
      return 'text-green-500';
    case 'in_progress':
      return 'text-blue-500';
    case 'open':
      return 'text-yellow-500';
    case 'ignored':
      return 'text-gray-400';
    default:
      return 'text-green-500';
  }
};

// Update the saveStatusToDatabase function to use a single toast notification
const saveStatusToDatabase = async (
  auditId: string,
  findingId: string, 
  status: FindingStatus, 
  setFindingStatuses: React.Dispatch<React.SetStateAction<Record<string, FindingStatus>>>,
  audit: Audit | null
) => {
  // Update local state immediately for UI responsiveness
  setFindingStatuses(prev => ({
    ...prev,
    [findingId]: status
  }));

  try {
    // Save to database
    await findingService.updateFindingStatus(auditId, findingId, status);
    
    // Get the finding index from the findingId (format: finding-{index})
    const findingIndex = parseInt(findingId.split('-')[1]);
    // Get the current audit and finding title
    const finding = audit?.results?.findings?.[findingIndex];
    const findingTitle = finding?.title || 'Issue';
    
    // Get the appropriate color for the status
    const statusIconColor = getStatusIconColor(status);
    
    // Show single success toast with more specific context and auto-dismiss
    toast({
      description: (
        <div className="flex items-center space-x-2 py-1">
          <CheckCircle className={`h-4 w-4 ${statusIconColor}`} />
          <span className="text-sm font-medium">
            {findingTitle.substring(0, 20)}{findingTitle.length > 20 ? '...' : ''} is now {status.replace('_', ' ')}
          </span>
        </div>
      ),
      variant: "default",
      duration: 1500, // Auto-dismiss after just 1.5 seconds
      className: "top-toast w-auto min-w-min py-2 px-3", // Compact container for navbar placement
    });
  } catch (error) {
    console.error("Error updating finding status:", error);
    
    // Show error toast with alert icon
    toast({
      description: (
        <div className="flex items-center space-x-2 py-1">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">Failed to update status</span>
        </div>
      ),
      variant: "destructive",
      duration: 3000, // Error stays a bit longer
      className: "top-toast w-auto min-w-min py-2 px-3", // Compact container for navbar placement
    });
    
    // Revert the local state change
    setFindingStatuses(prev => {
      const newState = { ...prev };
      delete newState[findingId]; // Remove the failed update
      return newState;
    });
  }
};

const AuditDetail: React.FC<AuditDetailProps> = ({ audit, loading, error }) => {
  const navigate = useNavigate();
  const { id: auditId } = useParams<{ id: string }>(); // Get audit ID from URL
  // Lift the state up to this component
  const [findingStatuses, setFindingStatuses] = useState<Record<string, FindingStatus>>({});
  const [statusesLoading, setStatusesLoading] = useState(true);
  
  // Load saved statuses from database when component mounts
  useEffect(() => {
    if (audit && auditId) {
      setStatusesLoading(true);
      findingService.getFindingStatuses(auditId)
        .then(savedStatuses => {
          setFindingStatuses(savedStatuses);
          setStatusesLoading(false);
        })
        .catch(err => {
          console.error("Error loading finding statuses:", err);
          setStatusesLoading(false);
        });
    }
  }, [audit, auditId]);
  
  // Handle status update with database persistence
  const handleStatusUpdate = (findingId: string, status: FindingStatus) => {
    if (!auditId) return;
    saveStatusToDatabase(auditId, findingId, status, setFindingStatuses, audit);
  };
  
  // Get name for Excel file
  const getFileName = () => {
    if (audit?.original_filename) {
      return audit.original_filename;
    }
    if (audit?.model_name && audit.model_name.toLowerCase() !== 'o3-mini') {
      return audit.model_name;
    }
    return "Excel Workbook";
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-[100px]" />
            <Skeleton className="h-6 w-[200px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <Skeleton className="h-24 w-24 rounded-full" />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-[80px] mb-2" />
                  <Skeleton className="h-5 w-[200px]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-[60px] mb-2" />
                    <Skeleton className="h-5 w-[100px]" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-[80px] mb-2" />
                    <Skeleton className="h-5 w-[150px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowBackIcon fontSize="small" style={{ marginRight: '4px' }} />
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  if (!audit) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-4">
          No audit found.
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowBackIcon fontSize="small" style={{ marginRight: '4px' }} />
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header Section with Back Button */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {audit.model_type?.toLowerCase() === 'excel' ? 'Excel Audit Report' : 
               audit.model_type?.toLowerCase() === 'word' ? 'Word Doc Audit' : 
               'PowerPoint Deck Audit'}
            </h1>
            <Badge className={`px-3 py-1 text-sm font-bold rounded-md ${getStatusColor(audit.status)}`}>
              {audit?.status?.toLowerCase() || 'unknown'}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowBackIcon fontSize="small" style={{ marginRight: '4px' }} />
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score Section */}
        {audit?.score !== null && audit?.score !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Risk Score</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className={`${getPriorityColor(audit.score >= 70 ? 'high' : audit.score >= 40 ? 'medium' : 'low')} w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold`}>
                {audit.score}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* File Information */}
        <Card className={audit?.score !== null ? "md:col-span-2" : "md:col-span-3"}>
          <CardHeader>
            <CardTitle>File Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Filename</h3>
              <p className="mt-1">{getFileName()}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {audit?.file_size_bytes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Size</h3>
                  <p className="mt-1">{(audit.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Uploaded</h3>
                <p className="mt-1">{formatDate(audit?.upload_timestamp || audit?.created_at)}</p>
              </div>
            </div>
            
            {audit?.description && audit.description !== "Excel analysis with o3-mini using tools" && (
              <div>
                <Separator className="my-2" />
                <h3 className="text-sm font-medium text-muted-foreground mt-2">Analysis Queries</h3>
                {(() => {
                  try {
                    // The description might be a JSON string that's already stringified
                    // First, try parsing it directly
                    let descriptionObj;
                    try {
                      descriptionObj = JSON.parse(audit.description);
                    } catch (e) {
                      // If that fails, the string might be escaped JSON, try unescaping first
                      descriptionObj = JSON.parse(JSON.parse(audit.description));
                    }

                    return (
                      <div className="mt-2">
                        {descriptionObj.presets && descriptionObj.presets.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {descriptionObj.presets.map((preset: string, index: number) => (
                              <Badge key={index} variant="secondary" className="capitalize rounded-md">
                                {preset.replace(/-/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {descriptionObj.customRequirements && (
                          <p className="mt-2 text-sm">{descriptionObj.customRequirements}</p>
                        )}
                      </div>
                    );
                  } catch (e) {
                    console.error("Error parsing description:", e);
                    // If JSON parsing fails, just display the raw description
                    return <p className="mt-1">{audit.description}</p>;
                  }
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Overview Section (moved below Analysis Queries) */}
      {audit?.results && audit?.status?.toLowerCase() === 'completed' && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>{audit.results.summary}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Identified Issues Section - directly shown now */}
      {audit?.results && audit?.status?.toLowerCase() === 'completed' && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Identified Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {statusesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <FindingsList 
                  results={audit.results} 
                  findingStatuses={findingStatuses} 
                  updateFindingStatus={handleStatusUpdate}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations Section */}
      {audit?.results && audit?.results.recommendations && audit?.status?.toLowerCase() === 'completed' && (
        <div className="space-y-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>{audit.results.recommendations}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Processing/Error States */}
      {audit?.status?.toLowerCase() === 'in_progress' || audit?.status?.toLowerCase() === 'processing' ? (
        <Card>
          <CardHeader>
            <CardTitle>Analysis in Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium text-center">We're currently analyzing your Excel file.</p>
            <p className="text-muted-foreground text-center mt-2">This process may take a few minutes.</p>
          </CardContent>
        </Card>
      ) : audit?.status?.toLowerCase() === 'failed' || audit?.status?.toLowerCase() === 'error' ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Analysis Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{audit.error_message || "There was an error processing your file. Our team has been notified."}</p>
          </CardContent>
        </Card>
      ) : audit?.status?.toLowerCase() === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Queued</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-center">Your file is in the analysis queue.</p>
            <p className="text-muted-foreground text-center mt-2">Analysis will begin shortly.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditDetail;
