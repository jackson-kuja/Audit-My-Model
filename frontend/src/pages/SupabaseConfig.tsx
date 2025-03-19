import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import { createClient } from '@supabase/supabase-js';

const SupabaseConfig: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if configuration exists
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    
    if (savedUrl && savedKey) {
      setUrl(savedUrl);
      setKey(savedKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!url || !key) {
        throw new Error('Please provide both Supabase URL and Anon Key');
      }

      // Test the connection
      const testClient = createClient(url, key);
      const { error: testError } = await testClient.auth.getSession();
      
      if (testError) {
        throw new Error('Failed to connect to Supabase. Please check your credentials.');
      }

      // Save configuration
      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_anon_key', key);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Supabase Configuration
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Please provide your Supabase project credentials to continue.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Supabase URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              margin="normal"
              required
              placeholder="https://your-project.supabase.co"
            />
            <TextField
              fullWidth
              label="Supabase Anon Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              margin="normal"
              required
              placeholder="your-anon-key"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Validating...' : 'Save Configuration'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default SupabaseConfig;
