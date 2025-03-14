import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SupabaseConfig = () => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if config already exists
  useEffect(() => {
    const storedUrl = localStorage.getItem('supabase_url');
    const storedKey = localStorage.getItem('supabase_anon_key');
    
    if (storedUrl && storedKey) {
      setSupabaseUrl(storedUrl);
      setSupabaseKey(storedKey);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    
    if (!supabaseUrl || !supabaseKey) {
      setError('Please enter both Supabase URL and Anonymous Key');
      setLoading(false);
      return;
    }

    try {
      // Store in localStorage
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_anon_key', supabaseKey);
      
      // Show success message
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.reload(); // Reload to apply new config
      }, 2000);
    } catch (err) {
      setError('An error occurred while saving the configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        p: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          mx: 'auto'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Supabase Configuration
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }} align="center">
          Enter your Supabase project details to enable authentication
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved successfully! Reloading...</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="supabaseUrl"
            label="Supabase URL"
            name="supabaseUrl"
            autoComplete="off"
            autoFocus
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://example.supabase.co"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="supabaseKey"
            label="Supabase Anonymous Key"
            id="supabaseKey"
            autoComplete="off"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SupabaseConfig;
