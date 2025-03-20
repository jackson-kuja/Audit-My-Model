import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { z } from 'zod';
import auditService from '../services/auditService';
import { Audit, mapStatusForDisplay, Task } from '../types/index';
import AddIcon from '@mui/icons-material/Add';

// Shadcn UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DataTable } from "../components/dashboard/data-table";
import { columns } from "../components/dashboard/columns";

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

// Function to convert Audits to Tasks format for the data table
const convertAuditsToTasks = (audits: Audit[]): Task[] => {
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
      created_at: audit.created_at
    };
  });
};

// Helper function to determine priority based on risk score
const getPriorityFromScore = (score: number): string => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setLoading(true);
        const audits = await auditService.getAudits();
        
        // Convert audits to the format expected by the DataTable
        const formattedTasks = convertAuditsToTasks(audits);
        setTasks(formattedTasks);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching audits:', err);
        setError('Failed to load audits. Please try again later.');
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  const handleAuditClick = (auditId: string) => {
    navigate(`/audit/${auditId}`);
  };

  // Filter tasks based on active tab
  const filteredTasks = React.useMemo(() => {
    if (activeTab === "all") return tasks;
    if (activeTab === "models") return tasks.filter(task => task.label === "model");
    if (activeTab === "decks") return tasks.filter(task => task.label === "deck");
    if (activeTab === "docs") return tasks.filter(task => task.label === "doc");
    return tasks;
  }, [tasks, activeTab]);

  // Get recent audits for stats card
  const recentAudits = tasks.slice(0, 3);

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

      {loading ? (
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
      ) : error ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardFooter>
        </Card>
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
                  {tasks.filter(task => task.status === "completed").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 text-center">
                <CardDescription>In Progress</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">
                  {tasks.filter(task => task.status === "in progress" || task.status === "processing").length}
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
                  <Card key={audit.id} className="hover:bg-accent cursor-pointer" onClick={() => handleAuditClick(audit.id)}>
                    <CardContent className="p-4 text-center">
                      <div className="space-y-2 flex flex-col items-center">
                        <h3 className="font-medium truncate whitespace-nowrap overflow-hidden w-full">{audit.title}</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status.toLowerCase()}
                          </Badge>
                          <Badge 
                            style={{ backgroundColor: getLabelColor(audit.label), color: '#fff' }}
                            className="text-xs font-semibold"
                          >
                            {audit.label.toLowerCase()}
                          </Badge>
                          <Badge className={getPriorityColor(audit.priority)}>
                            {audit.priority.toLowerCase()} risk
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground block mt-2">
                          {formatDate(audit.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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
