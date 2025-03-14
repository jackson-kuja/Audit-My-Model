import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Chip, 
  Button, 
  CircularProgress, 
  Alert,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Status chip colors
const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  error: 'error'
};

const AuditDetails = () => {
  const { auditId } = useParams();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Fetch audit details from the API
  const fetchAuditDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/audits/${auditId}?include_result=true`);
      setAudit(response.data.audit);
    } catch (err) {
      console.error('Error fetching audit details:', err);
      setError('Failed to load audit details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load audit details when the component mounts
  useEffect(() => {
    fetchAuditDetails();
    
    // Poll for updates if the audit is still processing
    let intervalId;
    
    if (audit && (audit.status === 'pending' || audit.status === 'in_progress')) {
      intervalId = setInterval(() => {
        fetchAuditDetails();
      }, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [auditId, audit?.status]);
  
  // Render loading state
  if (loading && !audit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }
  
  // If audit is not found or still loading
  if (!audit) {
    return null;
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Audit Report</Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">File Information</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Filename</Typography>
            <Typography variant="body1">{audit.original_filename}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip 
              label={audit.status.replace('_', ' ').toUpperCase()} 
              color={statusColors[audit.status] || 'default'}
              size="small"
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Uploaded</Typography>
            <Typography variant="body1">{formatDate(audit.created_at)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Completed</Typography>
            <Typography variant="body1">{formatDate(audit.completed_at)}</Typography>
          </Box>
        </Box>
      </Paper>
      
      {(audit.status === 'pending' || audit.status === 'in_progress') && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Your audit is still processing
          </Typography>
          <Typography variant="body1">
            {audit.status === 'pending' 
              ? 'Your Excel model is waiting to be processed. This may take up to 24 hours with a free account.' 
              : 'Your Excel model is currently being analyzed. This should take just a few minutes.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This page will automatically update when the process is complete.
          </Typography>
        </Paper>
      )}
      
      {audit.status === 'error' && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            There was an error processing your Excel model
          </Alert>
          <Typography variant="body1">
            Error details: {audit.error_message || 'Unknown error occurred'}
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/upload')}>
            Try Uploading Again
          </Button>
        </Paper>
      )}
      
      {audit.status === 'completed' && audit.audit_result && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Audit Results</Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ 
            '& a': { color: 'primary.main' },
            '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2, mb: 1 },
            '& ul, & ol': { pl: 2 },
            '& li': { mb: 1 },
          }}>
            <ReactMarkdown>{audit.audit_result}</ReactMarkdown>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AuditDetails;
