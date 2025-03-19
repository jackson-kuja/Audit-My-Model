import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import auditService from '../services/auditService';
import ReactMarkdown from 'react-markdown';
import { Audit } from '../types/index';

// Shadcn components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// Status badge variants
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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

const AuditDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };
  
  useEffect(() => {
    if (!id) {
      setError('No audit ID provided');
      setLoading(false);
      return;
    }
    
    const fetchAudit = async () => {
      try {
        const data = await auditService.getAuditById(id);
        setAudit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading audit details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAudit();
    
    // Set up polling for pending/in-progress audits
    let intervalId: NodeJS.Timeout | undefined;
    
    if (audit && (audit.status === 'pending' || audit.status === 'in_progress')) {
      intervalId = setInterval(fetchAudit, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, audit?.status]);
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  if (!audit) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-4">
        <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Audit not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Details</h1>
          <p className="text-muted-foreground mt-1">
            View complete results of your audit
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>File Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Filename</h3>
              <p className="mt-1">{audit.original_filename}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="mt-1">
                <Badge variant={getStatusVariant(audit.status)}>
                  {audit.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p className="mt-1">{formatDate(audit.created_at)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
              <p className="mt-1">{formatDate(audit.completed_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {(audit.status === 'pending' || audit.status === 'in_progress') && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p>
                {audit.status === 'pending'
                  ? 'Your file is queued for processing. This might take a few minutes.'
                  : 'Your file is currently being analyzed. Please check back in a few minutes.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {audit.status === 'error' && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Processing Error</AlertTitle>
          <AlertDescription>
            There was an error processing your file.
            {audit.error_message && (
              <div className="mt-2 text-sm">
                Error details: {audit.error_message}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Results section - only shown for completed audits */}
      {audit.status === 'completed' && audit.audit_result && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="prose max-w-none">
              <ReactMarkdown>{audit.audit_result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditDetails;
