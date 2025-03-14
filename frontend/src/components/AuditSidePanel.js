import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { formatDate } from '../utils/dateUtils';

// Status chip colors
const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  error: 'error'
};

const AuditSidePanel = ({ audit, open, onClose, loading, error }) => {
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
              <Typography variant="subtitle2" gutterBottom>Summary</Typography>
              <Typography variant="body2">{parsedResults.summary}</Typography>
            </Box>
          )}
          
          {parsedResults.issues && parsedResults.issues.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Key Issues</Typography>
              <List dense>
                {parsedResults.issues.map((issue, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={issue.title || issue.type} 
                      secondary={issue.description} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {parsedResults.recommendations && parsedResults.recommendations.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
              <List dense>
                {parsedResults.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': { 
          width: { xs: '100%', sm: '450px', md: '500px' },
          p: 0,
          boxSizing: 'border-box'
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2,
        bgcolor: 'grey.100'
      }}>
        <Typography variant="h6">Excel Audit</Typography>
        <IconButton onClick={onClose} size="large" edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : audit ? (
        <>
          {/* Status Bar */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: statusColors[audit?.status] ? `${statusColors[audit?.status]}.light` : 'info.light',
            color: statusColors[audit?.status] ? `${statusColors[audit?.status]}.dark` : 'info.dark'
          }}>
            <Typography variant="subtitle2">
              Status: {audit?.status?.toUpperCase() || 'UNKNOWN'}
            </Typography>
            <Typography variant="caption">
              Updated: {formatDate(audit?.updated_at)}
            </Typography>
          </Box>

          {/* Score Display - if it exists */}
          {audit?.score !== null && audit?.score !== undefined && (
            <Box sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="overline" display="block" gutterBottom>
                Risk Score
              </Typography>
              <Typography 
                variant="h2" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  color: getRiskScoreColor(audit.score)
                }}
              >
                {audit.score}
                <Typography component="span" variant="h5" color="text.secondary">
                  /100
                </Typography>
              </Typography>
            </Box>
          )}
          
          {/* File Info */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Filename
                </Typography>
                <Typography variant="body1" noWrap sx={{ mb: 1 }}>
                  {getFileName()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {audit?.file_size_bytes 
                    ? `${(audit.file_size_bytes / (1024 * 1024)).toFixed(2)} MB · ` 
                    : ''}
                  Uploaded: {formatDate(audit?.upload_timestamp || audit?.created_at)}
                </Typography>
              </Grid>
              
              {audit?.description && audit.description !== "Excel analysis with o3-mini using tools" && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {audit.description.replace(/o3-mini/gi, '')}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Grid>
              )}
            </Grid>
            
            {/* Results Section */}
            {audit?.results && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Analysis Results
                </Typography>
                {renderAuditResults(audit.results)}
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
          No audit selected
        </Typography>
      )}
    </Drawer>
  );
};

export default AuditSidePanel;
