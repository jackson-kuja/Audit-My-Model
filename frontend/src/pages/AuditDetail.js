import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Container
} from '@mui/material';
import { auditService } from '../services/auditService';
import { formatDate } from '../utils/dateUtils';

// Status chip colors
const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  error: 'error'
};

const AuditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Function to render audit results in a user-friendly way
  const renderAuditResults = (results) => {
    if (!results) return null;
    
    try {
      // If results is a string, try to parse it
      const parsedResults = typeof results === 'string' ? JSON.parse(results) : results;
      
      return (
        <Box>
          {parsedResults.summary && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Summary</Typography>
              <Typography variant="body1">{parsedResults.summary}</Typography>
            </Box>
          )}
          
          {parsedResults.issues && parsedResults.issues.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Key Issues</Typography>
              <List>
                {parsedResults.issues.map((issue, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle2" color="error.main">
                          {issue.title || issue.type}
                        </Typography>
                      } 
                      secondary={issue.description} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {parsedResults.recommendations && parsedResults.recommendations.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Recommendations</Typography>
              <List>
                {parsedResults.recommendations.map((rec, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle2" color="primary.main">
                          Recommendation {index + 1}
                        </Typography>
                      } 
                      secondary={rec} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* Additional metrics if available */}
          {parsedResults.metrics && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Performance Metrics</Typography>
              <Grid container spacing={2}>
                {Object.entries(parsedResults.metrics).map(([key, value]) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Typography>
                      <Typography variant="h6">{typeof value === 'number' ? value.toFixed(2) : value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      );
    } catch (e) {
      console.error("Error parsing audit results:", e);
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to parse results. Please try again later.
        </Alert>
      );
    }
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
  
  // Get color based on risk score
  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };
  
  // Fetch audit details
  useEffect(() => {
    const fetchAuditDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        const auditData = await auditService.getAuditById(id);
        setAudit(auditData);
      } catch (err) {
        console.error('Error fetching audit details:', err);
        setError('Failed to load audit details. Please try again.');
        
        // If audit doesn't exist, use mock data in development
        if (process.env.NODE_ENV === 'development') {
          setAudit({
            id,
            model_name: 'Sample Excel Model',
            description: 'Excel analysis using automated tools',
            status: 'in_progress',
            score: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setError('');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditDetails();
  }, [id]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section with Back Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1">
          Excel Audit Report
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      {/* Status Card */}
      <Box sx={{ 
        p: 2, 
        mb: 3,
        borderRadius: 1,
        bgcolor: statusColors[audit?.status] ? `${statusColors[audit?.status]}.light` : 'info.light',
        color: statusColors[audit?.status] ? `${statusColors[audit?.status]}.dark` : 'info.dark',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Status: {audit?.status?.toUpperCase() || 'UNKNOWN'}
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(audit?.created_at)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updated: {formatDate(audit?.updated_at)}
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Score Section */}
        {audit?.score !== null && audit?.score !== undefined && (
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="overline" display="block" gutterBottom>
                  Risk Score
                </Typography>
                <Typography 
                  variant="h1" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: getRiskScoreColor(audit.score)
                  }}
                >
                  {audit.score}
                  <Typography component="span" variant="h4" color="text.secondary">
                    /100
                  </Typography>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {/* File Information */}
        <Grid item xs={12} md={audit?.score !== null ? 8 : 12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>File Information</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Filename
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {getFileName()}
                  </Typography>
                </Grid>
                
                {audit?.file_size_bytes && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Size
                    </Typography>
                    <Typography variant="body1">
                      {(audit.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Uploaded
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(audit?.upload_timestamp || audit?.created_at)}
                  </Typography>
                </Grid>
                
                {audit?.description && audit.description !== "Excel analysis with o3-mini using tools" && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {audit.description.replace(/o3-mini/gi, '')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Results Section */}
        {audit?.results && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Analysis Results</Typography>
                <Divider sx={{ mb: 2 }} />
                {renderAuditResults(audit.results)}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default AuditDetail;
