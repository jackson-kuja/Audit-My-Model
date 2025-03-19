import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import auditService, { CreateAuditData } from '../services/auditService';
import { useAuth } from '../context/AuthContext';
import AddIcon from '@mui/icons-material/Add';

const NewAudit: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<CreateAuditData>({
    name: '',
    model_type: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create a new audit
      const newAudit = await auditService.createAudit(formData);
      
      // Redirect to the upload page for this audit
      navigate(`/audit/${newAudit.id}`);
    } catch (err) {
      console.error('Error creating audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to create audit');
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AddIcon sx={{ mr: 1 }} />
            Create New Audit
          </Box>
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Enter details about the model you want to audit
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Audit Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                helperText="Give your audit a descriptive name"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="model-type-label">Model Type</InputLabel>
                <Select
                  labelId="model-type-label"
                  name="model_type"
                  value={formData.model_type || ''}
                  label="Model Type"
                  onChange={handleChange}
                >
                  <MenuItem value="classification">Classification</MenuItem>
                  <MenuItem value="regression">Regression</MenuItem>
                  <MenuItem value="nlp">Natural Language Processing</MenuItem>
                  <MenuItem value="computer_vision">Computer Vision</MenuItem>
                  <MenuItem value="reinforcement_learning">Reinforcement Learning</MenuItem>
                  <MenuItem value="clustering">Clustering</MenuItem>
                  <MenuItem value="time_series">Time Series</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description (Optional)"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                helperText="Provide additional details about your model"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : undefined}
              >
                {loading ? 'Creating...' : 'Continue to Upload'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default NewAudit;
