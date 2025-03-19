import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('PrivateRoute - User:', user ? `Authenticated as ${user.email}` : 'Not authenticated');
  console.log('PrivateRoute - Loading:', loading);
  console.log('PrivateRoute - Current path:', window.location.pathname);

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      console.log('PrivateRoute - No authenticated user found, redirecting to login');
      // Use direct window location change for more reliable redirection
      window.location.href = '/login';
    }
  }, [loading, user]);

  if (loading) {
    console.log('PrivateRoute - Still loading, showing spinner');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If we have a user, render the child routes
  if (user) {
    console.log('PrivateRoute - User authenticated, rendering Outlet');
    return <Outlet />;
  }

  console.log('PrivateRoute - No user and not loading, returning null');
  // Return null instead of Navigate to avoid React Router issues
  return null;
};

export default PrivateRoute; 