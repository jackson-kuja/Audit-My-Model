import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { z } from 'zod';
import auditService from '../services/auditService';
import { Audit, mapStatusForDisplay, Task } from '../types/index';

// Shadcn UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DataTable } from "../components/dashboard/data-table";
import { columns } from "../components/dashboard/columns";
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
                  audit.model_type === 'word' ? 'document' : 
                  audit.model_type === 'powerpoint' ? 'presentation' : 'data';
    
    return {
      id: audit.id,
      title: audit.name || `Audit ${audit.id}`,
      status: mapStatusForDisplay(audit.status).toLowerCase(),
      label: audit.audit_type || label,
      priority: getPriorityFromScore(audit.risk_score || audit.score || 0),
    };
  });
};

// Helper function to determine priority based on risk score
const getPriorityFromScore = (score: number): string => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

// Get custom status badge colors
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-teal-600 text-white hover:bg-teal-700';
    case 'pending':
    case 'todo':
      return 'bg-teal-400 text-black hover:bg-teal-500';
    case 'in_progress':
    case 'processing':
      return 'bg-teal-500 text-white hover:bg-teal-600';
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'canceled':
      return 'bg-teal-800 text-white hover:bg-teal-900';
    default:
      return 'bg-teal-300 text-black hover:bg-teal-400';
  }
};

// Get custom priority badge colors
const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-violet-700 text-white hover:bg-violet-800';
    case 'medium':
      return 'bg-violet-500 text-white hover:bg-violet-600';
    case 'low':
      return 'bg-violet-300 text-black hover:bg-violet-400';
    default:
      return 'bg-violet-200 text-black hover:bg-violet-300';
  }
};

// Helper function to get color for label badge
const getLabelColor = (label: string): string => {
  switch (label.toLowerCase()) {
    case 'model':
      return '#8b5cf6'; // Violet-500
    case 'document':
      return '#3b82f6'; // Blue-500
    case 'presentation':
      return '#f97316'; // Orange-500
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

// Get status badge variant similar to AuditDetail
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
    if (activeTab === "completed") return tasks.filter(task => task.status === "completed");
    if (activeTab === "inprogress") return tasks.filter(task => task.status === "in progress" || task.status === "processing");
    if (activeTab === "pending") return tasks.filter(task => task.status === "pending" || task.status === "todo");
    return tasks;
  }, [tasks, activeTab]);

  // Get recent audits for stats card
  const recentAudits = tasks.slice(0, 3);

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
              Create New Audit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Audits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.filter(task => task.status === "completed").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>In Progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.filter(task => task.status === "in progress" || task.status === "processing").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAudits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent audits</p>
                ) : (
                  recentAudits.map(audit => (
                    <Card key={audit.id} className="hover:bg-accent cursor-pointer" onClick={() => handleAuditClick(audit.id)}>
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="font-medium">{audit.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getStatusColor(audit.status)}>
                              {audit.status.toLowerCase()}
                            </Badge>
                            <Badge 
                              style={{ backgroundColor: getLabelColor(audit.label), color: '#fff' }}
                              className="text-xs font-semibold"
                            >
                              {audit.label.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(audit.priority)}>
                          {audit.priority.toLowerCase()} risk
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("all")}>
                View All
              </Button>
            </CardFooter>
          </Card>

          {/* Audit Table Section with Tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Audits</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="inprogress">In Progress</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardContent className="p-0 sm:p-6">
                  <DataTable 
                    data={filteredTasks} 
                    columns={columns} 
                    onRowClick={handleAuditClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardContent className="p-0 sm:p-6">
                  <DataTable 
                    data={filteredTasks} 
                    columns={columns} 
                    onRowClick={handleAuditClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inprogress" className="space-y-4">
              <Card>
                <CardContent className="p-0 sm:p-6">
                  <DataTable 
                    data={filteredTasks} 
                    columns={columns} 
                    onRowClick={handleAuditClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardContent className="p-0 sm:p-6">
                  <DataTable 
                    data={filteredTasks} 
                    columns={columns} 
                    onRowClick={handleAuditClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Mobile view is now integrated with the main design using responsive classes */}
    </div>
  );
};

export default Dashboard;
