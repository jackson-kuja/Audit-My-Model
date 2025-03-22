import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { z } from 'zod';
import auditService from '../services/auditService';
import { Audit, mapStatusForDisplay, Task, AuditStatus } from '../types/index';
import AddIcon from '@mui/icons-material/Add';
import Lock from '@mui/icons-material/Lock';
import { usePageTitle } from '../hooks/usePageTitle';
import { supabase } from '../utils/supabase';

// Shadcn UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DataTable } from "../components/dashboard/data-table";
import { columns } from "../components/dashboard/columns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

// Import color functions
import { 
  getStatusColor,
  getPriorityColor,
  getLabelColor
} from '../utils/colorTheme';

// Import the formatDate utility 
import { formatDate } from '../utils/dateUtils';

// Schema validation for Task type
const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
});

// Check if an audit is locked for free users (locked if less than 24 hours old)
const isAuditLocked = (audit: Audit, isUserPaid: boolean): boolean => {
  // If user is paid, never lock audits
  if (isUserPaid) return false;
  
  // For free users, check if audit is less than 24 hours old
  const createdAt = new Date(audit.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Lock if less than 24 hours have passed
  return hoursDiff < 24;
};

// Function to convert Audits to Tasks format for the data table
const convertAuditsToTasks = (audits: Audit[], isUserPaid: boolean): Task[] => {
  return audits.map(audit => {
    const label = audit.model_type === 'excel' ? 'model' :
                audit.model_type === 'word' ? 'doc' : 
                audit.model_type === 'powerpoint' ? 'deck' : 'data';
    
    return {
      id: audit.id,
      title: audit.name || `Audit ${audit.id}`,
      status: mapStatusForDisplay(audit.status).toLowerCase(),
      label: audit.audit_type || label,
      priority: getPriorityFromScore(audit.risk_score || audit.score || 0),
      created_at: audit.created_at,
      locked: isAuditLocked(audit, isUserPaid)
    };
  });
};

// Helper function to determine priority based on risk score
const getPriorityFromScore = (score: number): string => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

// Calculate hours remaining until audit unlocks (24 hours from creation)
const getHoursRemaining = (createdAt: string): number => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const hoursPassed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, 24 - hoursPassed);
  return Math.ceil(hoursRemaining); // Round up for better UX
};

const Dashboard: React.FC = () => {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [recentAudits, setRecentAudits] = useState<Task[]>([]);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // Get user's payment tier
  const isUserPaid = user?.user_tier === 'paid' || user?.is_paid === true;

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setIsLoading(true);
        // Get user session directly from Supabase if user context is not available
        let userId = user?.id;
        
        if (!userId) {
          console.log('[Dashboard] No user ID in context, checking Supabase session directly');
          
          // First try getting user from active session
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            userId = data.session.user.id;
            console.log('[Dashboard] Found user ID from Supabase session:', userId);
          } else {
            // Fallback - check localStorage directly for auth token
            console.log('[Dashboard] No session found, checking localStorage for auth token');
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('supabase.auth.token')) {
                try {
                  const tokenStr = localStorage.getItem(key);
                  if (tokenStr) {
                    const tokenData = JSON.parse(tokenStr);
                    if (tokenData?.currentSession?.user?.id) {
                      userId = tokenData.currentSession.user.id;
                      console.log('[Dashboard] Found user ID from localStorage token:', userId);
                      break;
                    }
                  }
                } catch (error) {
                  console.error('[Dashboard] Error parsing token from localStorage:', error);
                }
              }
            }
          }
        } else {
          console.log('[Dashboard] Using user ID from context:', userId);
        }
        
        if (!userId) {
          console.log('[Dashboard] No user ID available, cannot fetch audits');
          setIsLoading(false);
          setTasks([]);
          setRecentAudits([]);
          return;
        }

        // DIRECTLY USE userId FOR MANUAL DB CALL - bypass auditService
        console.log('[Dashboard] Making direct Supabase query with user ID:', userId);
        const { data: auditData, error } = await supabase
          .from('audits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('[Dashboard] Error fetching audits directly:', error);
          setIsLoading(false);
          setTasks([]);
          setRecentAudits([]);
          return;
        }
        
        console.log('[Dashboard] Audits received directly:', auditData);
        
        if (!auditData || auditData.length === 0) {
          console.log('[Dashboard] No audits found for user');
          setIsLoading(false);
          setTasks([]);
          setRecentAudits([]);
          return;
        }
          
        // Convert raw database objects to Audit type
        const audits = auditData.map(item => ({
          id: item.id,
          user_id: item.user_id,
          name: item.name || item.model_name || '',
          model_name: item.model_name,
          model_type: item.model_type,
          description: item.description,
          file_path: item.file_path,
          audit_type: item.audit_type,
          results: item.results,
          original_filename: item.original_filename,
          status: (item.status as AuditStatus) || 'pending',
          created_at: item.created_at,
          updated_at: item.updated_at,
          completed_at: item.completed_at,
          risk_score: (item.score || item.risk_score || 0) as number,
          score: (item.score || 0) as number,
          summary: item.summary,
          audit_result: item.audit_result,
          error_message: item.error_message
        }));
        
        // Convert audits to the format expected by the DataTable
        const formattedTasks = convertAuditsToTasks(audits, isUserPaid);
        setTasks(formattedTasks);
        setRecentAudits(formattedTasks.slice(0, 3));
        setIsLoading(false);
      } catch (err) {
        console.error('[Dashboard] Error fetching audits:', err);
        setIsLoading(false);
        // Set empty arrays so UI doesn't stay in loading state forever
        setTasks([]);
        setRecentAudits([]);
      }
    };

    // Always try to fetch audits immediately
    fetchAudits();
    
    // Set a retry timer if we're still loading after a delay
    const retryTimer = setTimeout(() => {
      if (isLoading) {
        console.log('[Dashboard] Retrying audit fetch after delay');
        fetchAudits();
      }
    }, 3000);
    
    return () => clearTimeout(retryTimer);
  }, [user, isUserPaid]);

  // Handle clicking on an audit card
  const handleAuditClick = (id: string) => {
    const audit = tasks.find(task => task.id === id);
    if (audit?.locked) {
      setOpenTooltipId(id); // Just open tooltip for locked audits
    } else {
      navigate(`/audit/${id}`);
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = React.useMemo(() => {
    if (activeTab === "all") return tasks;
    if (activeTab === "models") return tasks.filter(task => task.label === "model");
    if (activeTab === "decks") return tasks.filter(task => task.label === "deck");
    if (activeTab === "docs") return tasks.filter(task => task.label === "doc");
    return tasks;
  }, [tasks, activeTab]);

  // Get audits by type for filtering
  const allAudits = tasks;
  const modelAudits = tasks.filter(audit => audit.label === 'model');
  const deckAudits = tasks.filter(audit => audit.label === 'deck');
  const docAudits = tasks.filter(audit => audit.label === 'doc');
  
  // Determine if we should show type filters (only if more than one type exists)
  const fileTypes = [
    { type: 'model', count: modelAudits.length },
    { type: 'deck', count: deckAudits.length },
    { type: 'doc', count: docAudits.length }
  ].filter(typeObj => typeObj.count > 0);
  
  const shouldShowTypeFilters = fileTypes.length > 1;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email?.split('@')[0] || 'User'}
          </p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <AddIcon fontSize="small" style={{ marginRight: '4px' }} />
          New Audit
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton for Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          </div>
          
          {/* Skeleton for Recent Activity */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          
          {/* Skeleton for Data Table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>No audits found</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <p className="text-muted-foreground">
              Create your first audit to get started with analyzing your models.
            </p>
            <Button onClick={() => navigate('/upload')}>
              <AddIcon fontSize="small" style={{ marginRight: '4px' }} />
              Create New Audit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2 text-center">
                <CardDescription>Total Audits</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">{tasks.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 text-center">
                <CardDescription>Completed</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">
                  {tasks.filter(task => task.status === "completed" && !task.locked).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 text-center">
                <CardDescription>Pending</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">
                  {tasks.filter(task => task.status === "in progress" || task.status === "processing" || task.status === "pending" || task.locked).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Audits</h2>
            {recentAudits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent audits</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentAudits.map(audit => (
                  <TooltipProvider key={audit.id}>
                    <Tooltip open={openTooltipId === audit.id} onOpenChange={(open) => {
                      if (open) {
                        setOpenTooltipId(audit.id);
                      } else {
                        setOpenTooltipId(null);
                      }
                    }}>
                      <TooltipTrigger asChild>
                        <Card 
                          className={`hover:bg-accent cursor-pointer relative ${audit.locked ? 'opacity-70' : ''}`} 
                          onClick={() => handleAuditClick(audit.id)}
                        >
                          {audit.locked && (
                            <div className="absolute top-2 right-2 bg-background rounded-full p-1 shadow">
                              <Lock fontSize="small" className="text-muted-foreground" />
                            </div>
                          )}
                          <CardContent className="p-4 text-center">
                            <div className="space-y-2 flex flex-col items-center">
                              <h3 className="font-medium truncate whitespace-nowrap overflow-hidden w-full">{audit.title}</h3>
                              <div className="flex flex-wrap gap-2 justify-center">
                                <Badge className={`${getStatusColor(audit.locked ? 'locked' : audit.status)} rounded-md`}>
                                  {audit.locked ? 'locked' : audit.status.toLowerCase()}
                                </Badge>
                                <Badge 
                                  style={{ backgroundColor: getLabelColor(audit.label), color: '#fff' }}
                                  className="text-xs font-semibold rounded-md"
                                >
                                  {audit.label.toLowerCase()}
                                </Badge>
                                <Badge className={`${getPriorityColor(audit.priority)} rounded-md`}>
                                  {audit.priority.toLowerCase()} risk
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground block mt-2">
                                {formatDate(audit.created_at)}
                                {audit.locked && " • Unlocks in " + getHoursRemaining(audit.created_at) + " Hours"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      {audit.locked && (
                        <TooltipContent className="w-52 p-2" side="top" sideOffset={5} delayDuration={100}>
                          <div className="space-y-1">
                            <p className="font-medium text-center">Unlocks in {getHoursRemaining(audit.created_at)} Hours</p>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/profile?tab=subscription');
                              }}
                            >
                              Get Access Now
                            </Button>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>

          {/* Audit Table Section with Tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            {shouldShowTypeFilters && (
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Audits</TabsTrigger>
                  {modelAudits.length > 0 && <TabsTrigger value="models">Models</TabsTrigger>}
                  {deckAudits.length > 0 && <TabsTrigger value="decks">Decks</TabsTrigger>}
                  {docAudits.length > 0 && <TabsTrigger value="docs">Docs</TabsTrigger>}
                </TabsList>
              </div>
            )}
            
            <TabsContent value="all" className="space-y-4">
              <DataTable 
                data={filteredTasks} 
                columns={columns} 
                onRowClick={handleAuditClick}
              />
            </TabsContent>
            
            <TabsContent value="models" className="space-y-4">
              <DataTable 
                data={filteredTasks} 
                columns={columns} 
                onRowClick={handleAuditClick}
              />
            </TabsContent>
            
            <TabsContent value="decks" className="space-y-4">
              <DataTable 
                data={filteredTasks} 
                columns={columns} 
                onRowClick={handleAuditClick}
              />
            </TabsContent>
            
            <TabsContent value="docs" className="space-y-4">
              <DataTable 
                data={filteredTasks} 
                columns={columns} 
                onRowClick={handleAuditClick}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Mobile view is now integrated with the main design using responsive classes */}
    </div>
  );
};

export default Dashboard;
