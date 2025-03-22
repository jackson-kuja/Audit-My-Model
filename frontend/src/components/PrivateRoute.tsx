import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [localAuthChecked, setLocalAuthChecked] = useState(false);
  const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(false);
  
  // Check localStorage for auth flags immediately
  useEffect(() => {
    console.log('PrivateRoute - Checking localStorage for authentication flags');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // Also check for Supabase session
    let hasSupabaseSession = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase') && key.includes('session')) {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session && session.access_token) {
              hasSupabaseSession = true;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error checking Supabase session:', e);
    }
    
    setIsLocallyAuthenticated(isAuthenticated || hasSupabaseSession);
    setLocalAuthChecked(true);
    console.log('PrivateRoute - Local auth check result:', { isAuthenticated, hasSupabaseSession });
  }, []);
  
  console.log('PrivateRoute - User:', user ? `Authenticated as ${user.email}` : 'Not authenticated');
  console.log('PrivateRoute - Loading:', loading);
  console.log('PrivateRoute - LocalAuthChecked:', localAuthChecked);
  console.log('PrivateRoute - IsLocallyAuthenticated:', isLocallyAuthenticated);
  console.log('PrivateRoute - Current path:', window.location.pathname);

  useEffect(() => {
    // If user is not authenticated and we've finished loading, redirect to login
    if ((!loading && !user) && (localAuthChecked && !isLocallyAuthenticated)) {
      console.log('PrivateRoute - User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [user, loading, navigate, localAuthChecked, isLocallyAuthenticated]);
  
  // Show content if either React state or localStorage indicates user is authenticated
  if (user || isLocallyAuthenticated) {
    console.log('PrivateRoute - User authenticated (React state or localStorage), rendering children');
    return <>{children}</>;
  }
  
  // Show loading spinner only if both checks are inconclusive
  if (loading || !localAuthChecked) {
    console.log('PrivateRoute - Still loading, showing spinner');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If we reach here, user is not authenticated
  return null; // Null because redirect happens in useEffect
};

export default PrivateRoute;