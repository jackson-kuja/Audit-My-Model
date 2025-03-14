import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Fetch subscription plans and user's current subscription
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch available subscription plans
        const plansResponse = await axios.get('/api/subscription/plans');
        setPlans(plansResponse.data.plans);
        
        // Fetch user's current subscription
        const subscriptionResponse = await axios.get('/api/subscription/current');
        setCurrentSubscription(subscriptionResponse.data.subscription);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle subscription checkout
  const handleSubscribe = async (planId) => {
    setProcessingPayment(true);
    setError('');
    
    try {
      // In a real implementation, this would create a checkout session with Stripe
      // For this demo, we'll use the simulated upgrade endpoint
      const response = await axios.post('/api/subscription/simulate-upgrade');
      
      // Update user information with new subscription status
      updateUserInfo({ ...user, ...response.data.subscription });
      
      // Update current subscription state
      setCurrentSubscription(response.data.subscription);
      
      // Show success message
      alert('Subscription upgraded successfully!');
    } catch (err) {
      console.error('Error processing subscription:', err);
      setError('Failed to process subscription. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Subscription Plans</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {currentSubscription && currentSubscription.is_paid && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Current Subscription</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Plan</Typography>
              <Typography variant="body1">Premium Plan</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip label="Active" color="success" size="small" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Renewal Date</Typography>
              <Typography variant="body1">{formatDate(currentSubscription.subscription_end_date)}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You currently have a premium subscription with priority model auditing.
          </Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: plan.id !== 'free' && !currentSubscription?.is_paid ? '2px solid' : 'none',
                borderColor: 'primary.main'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {plan.id !== 'free' && !currentSubscription?.is_paid && (
                  <Chip 
                    label="RECOMMENDED" 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                )}
                <Typography variant="h5" component="div" gutterBottom>
                  {plan.name}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ${plan.price}{plan.interval ? `/${plan.interval}` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>
                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                {plan.id === 'free' ? (
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    disabled={!currentSubscription?.is_paid}
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    fullWidth 
                    variant="contained" 
                    disabled={currentSubscription?.is_paid || processingPayment}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {processingPayment ? <CircularProgress size={24} /> : 'Upgrade Now'}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* FAQ or additional information */}
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>What's the difference between free and premium?</Typography>
        <Typography variant="body2" paragraph>
          Free users' Excel models are processed in a batch queue which can take up to 24 hours.
          Premium users' models are processed immediately in a priority queue.
        </Typography>
        
        <Typography variant="subtitle1">Can I cancel my subscription?</Typography>
        <Typography variant="body2" paragraph>
          Yes, you can cancel your subscription at any time. Your premium access will continue until the end of your billing period.
        </Typography>
        
        <Typography variant="subtitle1">Is there a limit to how many models I can upload?</Typography>
        <Typography variant="body2" paragraph>
          No, both free and premium users can upload an unlimited number of Excel models for auditing.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Subscription;
