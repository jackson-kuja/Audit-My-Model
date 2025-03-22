import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  console.log('PrivateRoute - User:', user ? `Authenticated as ${user.email}` : 'Not authenticated');
  console.log('PrivateRoute - Loading:', loading);
  console.log('PrivateRoute - Current path:', window.location.pathname);

  useEffect(() => {
    // If user is not authenticated and we've finished loading, redirect to login
    if (!loading && !user) {
      console.log('PrivateRoute - User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  // Show loading or outlet depending on auth state
  if (loading) {
    console.log('PrivateRoute - Still loading, showing spinner');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('PrivateRoute - User authenticated, rendering Outlet');
  return user ? <Outlet /> : null; // Null because redirect happens in useEffect
};

export default PrivateRoute; 