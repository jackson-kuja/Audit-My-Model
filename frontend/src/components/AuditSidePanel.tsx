import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { formatDate } from '../utils/dateUtils';
import { Audit, AuditResult } from '../types/index';

interface AuditSidePanelProps {
  audit: Audit | null;
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

const AuditSidePanel: React.FC<AuditSidePanelProps> = ({ audit, open, onClose, loading, error }) => {
  // Function to render audit results
  const renderAuditResults = (results: AuditResult) => {
    if (!results) return null;

    try {
      // Try to parse the results if they're in string format
      const parsedResults = typeof results === 'string' ? JSON.parse(results) : results;
      
      return (
        <Box>
          {parsedResults.findings && parsedResults.findings.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Key Findings</Typography>
              {parsedResults.findings.map((finding: any, index: number) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    {finding.title}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {finding.description}
                  </Typography>
                  <Chip
                    label={finding.severity.toUpperCase()}
                    color={
                      finding.severity === 'high' ? 'error' : 
                      finding.severity === 'medium' ? 'warning' : 'success'
                    }
                    size="small"
                  />
                </Paper>
              ))}
            </Box>
          )}
          
          {parsedResults.recommendations && parsedResults.recommendations.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              {parsedResults.recommendations.map((rec: any, index: number) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2">{rec}</Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      );
    } catch (err) {
      console.error('Error parsing audit results:', err);
      return (
        <Alert severity="error">
          Unable to display audit results. Please view the full report.
        </Alert>
      );
    }
  };
  
  // Function to get color based on risk score
  const getRiskScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 450 },
          p: 3,
          height: '100%',
          overflowY: 'auto'
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Audit Details</Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : !audit ? (
        <Alert severity="warning">No audit details available.</Alert>
      ) : (
        <Box>
          <Box sx={{ 
            p: 2, 
            mb: 3,
            borderRadius: 1,
            bgcolor: audit?.status ? `${audit.status}.light` : 'info.light',
            color: audit?.status ? `${audit.status}.dark` : 'info.dark',
          }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Status: {audit?.status?.toUpperCase() || 'UNKNOWN'}
            </Typography>
          </Box>
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            File Name
          </Typography>
          <Typography variant="body1" gutterBottom>
            {audit.original_filename || audit.model_name || 'Unnamed Audit'}
          </Typography>
          
          <Box mt={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(audit.created_at)}
            </Typography>
          </Box>
          
          {audit.completed_at && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDate(audit.completed_at)}
              </Typography>
            </Box>
          )}
          
          {audit.score !== null && audit.score !== undefined && (
            <Box mt={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Risk Score
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: getRiskScoreColor(audit.score),
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {audit.score}
              </Box>
            </Box>
          )}
          
          {audit.results && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Results Summary</Typography>
              <Divider sx={{ mb: 2 }} />
              {renderAuditResults(audit.results)}
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default AuditSidePanel;
