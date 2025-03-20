import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import { Audit, AuditResult } from '../types/index';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Shadcn components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  getStatusColor,
  getPriorityColor
} from '../utils/colorTheme';

interface AuditDetailProps {
  audit: Audit | null;
  loading: boolean;
  error: string | null;
}

const renderAuditResults = (results: AuditResult) => {
  if (!results) return null;

  return (
    <div className="space-y-4">
      {results.findings?.map((finding, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{finding.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{finding.description}</p>
          </CardContent>
          <CardFooter>
            <Badge 
              className={getPriorityColor(finding.severity)}
            >
              {finding.severity.toLowerCase()}
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const AuditDetail: React.FC<AuditDetailProps> = ({ audit, loading, error }) => {
  const navigate = useNavigate();
  
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
            <h1 className="text-3xl font-bold tracking-tight text-black">
              {audit.model_type?.toLowerCase() === 'excel' ? 'Excel Audit Report' : 
               audit.model_type?.toLowerCase() === 'word' ? 'Word Doc Audit' : 
               'PowerPoint Deck Audit'}
            </h1>
            <Badge className={`px-3 py-1 text-sm font-bold ${getStatusColor(audit.status)}`}>
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
                <h3 className="text-sm font-medium text-muted-foreground mt-2">Analysis Options</h3>
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
                              <Badge key={index} variant="secondary" className="capitalize">
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
      
      {/* Audit Results Section */}
      {audit?.results && audit?.status?.toLowerCase() === 'completed' ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="findings">Detailed Findings</TabsTrigger>
            {audit.results.recommendations && (
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="findings" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Identified Issues</h2>
            {renderAuditResults(audit.results)}
          </TabsContent>
          
          {audit.results.recommendations && (
            <TabsContent value="recommendations" className="space-y-4">
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
            </TabsContent>
          )}
        </Tabs>
      ) : audit?.status?.toLowerCase() === 'in_progress' || audit?.status?.toLowerCase() === 'processing' ? (
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
