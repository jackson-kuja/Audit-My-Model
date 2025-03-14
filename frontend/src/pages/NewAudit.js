import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { auditService } from '../services/auditService';
import { useAuth } from '../context/AuthContext';

const NewAudit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    model_name: '',
    model_type: '',
    description: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Submit the audit to Supabase
      const newAudit = await auditService.createAudit(formData);
      setSuccess(true);
      
      // Reset the form
      setFormData({
        model_name: '',
        model_type: '',
        description: '',
      });
      
      // Redirect to the audit details page after a short delay
      setTimeout(() => {
        navigate(`/audits/${newAudit.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating audit:', err);
      setError('Failed to create audit. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Close success message
  const handleCloseSuccess = () => {
    setSuccess(false);
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Model Audit
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Model Name"
            name="model_name"
            value={formData.model_name}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="model-type-label">Model Type</InputLabel>
            <Select
              labelId="model-type-label"
              name="model_type"
              value={formData.model_type}
              onChange={handleChange}
              label="Model Type"
            >
              <MenuItem value="language">Language Model</MenuItem>
              <MenuItem value="vision">Vision Model</MenuItem>
              <MenuItem value="classification">Classification Model</MenuItem>
              <MenuItem value="regression">Regression Model</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            margin="normal"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading || !formData.model_name}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Audit'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Audit created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewAudit;
