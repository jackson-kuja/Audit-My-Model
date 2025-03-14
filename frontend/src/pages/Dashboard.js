import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auditService } from '../services/auditService';
import AuditSidePanel from '../components/AuditSidePanel';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import { formatDate } from '../utils/dateUtils';

// Status chip colors
const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  error: 'error'
};

const Dashboard = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch audits from Supabase
  const fetchAudits = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get audits from Supabase using our service
      const { audits: auditData, pages } = await auditService.getAudits(page, 10);
      setAudits(auditData);
      setTotalPages(pages);
    } catch (err) {
      console.error('Error fetching audits:', err);
      setError('Failed to load audits. Please try again.');
      
      // If in development and no audits table exists yet, use mock data
      if (err.code === '42P01') { // Relation does not exist error
        console.warn('Audits table may not exist yet, showing mock data');
        const mockAudits = [
          {
            id: 'mock-audit-1',
            model_name: 'GPT-4 Demo Model',
            status: 'completed',
            score: 89,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-audit-2',
            model_name: 'Sentiment Analysis Model',
            status: 'in_progress',
            score: null,
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updated_at: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
          }
        ];
        setAudits(mockAudits);
        setTotalPages(1);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load audits when the component mounts or page changes
  useEffect(() => {
    fetchAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Show audit details in side panel
  const handleViewAudit = async (auditId, e) => {
    // Don't open side panel for pending or in_progress audits
    const audit = audits.find(a => a.id === auditId);
    if (audit && (audit.status === 'pending' || audit.status === 'in_progress')) {
      return;
    }
    
    // Prevent event bubbling if clicked on action buttons
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    setDetailsLoading(true);
    setDetailsError('');
    setSidePanelOpen(true);
    
    try {
      // Fetch the full audit details
      const auditData = await auditService.getAuditById(auditId);
      setSelectedAudit(auditData);
    } catch (err) {
      console.error('Error fetching audit details:', err);
      setDetailsError('Failed to load audit details. Please try again.');
      
      // If in development and no audit is found, use a mock audit
      if (process.env.NODE_ENV === 'development') {
        const mockAudit = audits.find(audit => audit.id === auditId) || {
          id: auditId,
          model_name: 'Sample Model',
          model_type: 'language',
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setSelectedAudit(mockAudit);
        setDetailsError('');
      }
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Handle delete audit
  const handleDeleteAudit = async (auditId, e) => {
    // Prevent event bubbling
    if (e) {
      e.stopPropagation();
    }
    
    try {
      await auditService.deleteAudit(auditId);
      // Refresh the audits list
      fetchAudits();
    } catch (err) {
      console.error('Error deleting audit:', err);
      setError('Failed to delete audit. Please try again.');
    }
  };
  
  // Handle cancel audit request
  const handleCancelAudit = async (auditId, e) => {
    // Prevent event bubbling
    if (e) {
      e.stopPropagation();
    }
    
    try {
      await auditService.cancelAudit(auditId);
      // Refresh the audits list
      fetchAudits();
    } catch (err) {
      console.error('Error cancelling audit:', err);
      setError(`Failed to cancel audit request: ${err.message || 'Unknown error'}`);
      // Refresh the audits list to ensure we're showing current state
      fetchAudits();
    }
  };
  
  // Close the side panel
  const handleCloseSidePanel = () => {
    setSidePanelOpen(false);
    // Clear the selected audit after a short delay for a better animation experience
    setTimeout(() => {
      setSelectedAudit(null);
    }, 300);
  };
  
  // Navigate to upload page
  const handleUpload = () => {
    navigate('/upload');
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Audits</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/upload')}>
          Create New Audit
        </Button>
      </Box>
      
      {!user.is_paid && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are using a free account. Audit processing may take up to 24 hours. 
          <Button color="inherit" size="small" onClick={() => navigate('/subscription')}>
            Upgrade to Premium
          </Button>
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 0, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : audits.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              You haven't uploaded any Excel models for auditing yet.
            </Typography>
            <Button variant="contained" color="primary" onClick={handleUpload} sx={{ mt: 2 }}>
              Upload Your First Model
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow 
                    key={audit.id} 
                    hover 
                    onClick={(e) => handleViewAudit(audit.id, e)} 
                    sx={{ 
                      cursor: audit.status === 'pending' || audit.status === 'in_progress' ? 'default' : 'pointer'
                    }}
                  >
                    <TableCell>{audit.original_filename}</TableCell>
                    <TableCell>
                      <Chip 
                        label={audit.status.replace('_', ' ').toUpperCase()} 
                        color={statusColors[audit.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(audit.created_at)}</TableCell>
                    <TableCell>{formatDate(audit.completed_at)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {audit.status === 'pending' || audit.status === 'in_progress' ? (
                          <Tooltip title="Stop Processing">
                            <Button 
                              variant="outlined" 
                              color="warning"
                              size="small" 
                              startIcon={<CancelIcon />}
                              onClick={(e) => handleCancelAudit(audit.id, e)}
                            >
                              Cancel
                            </Button>
                          </Tooltip>
                        ) : (
                          <>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={(e) => handleViewAudit(audit.id, e)}
                            >
                              {audit.status === 'completed' ? 'View Results' : 'View Details'}
                            </Button>
                            
                            <Tooltip title="Delete Audit">
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={(e) => handleDeleteAudit(audit.id, e)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      )}
      
      {/* Audit details side panel */}
      <AuditSidePanel
        audit={selectedAudit}
        open={sidePanelOpen}
        onClose={handleCloseSidePanel}
        loading={detailsLoading}
        error={detailsError}
      />
    </Box>
  );
};

export default Dashboard;
