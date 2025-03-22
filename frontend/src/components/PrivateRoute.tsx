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
  
  // Check all possible authentication sources immediately
  useEffect(() => {
    console.log('PrivateRoute - Checking all possible authentication sources');
    
    // Check URL parameters first (fastest method)
    const urlParams = new URLSearchParams(window.location.search);
    const isUrlAuthenticated = urlParams.get('authenticated') === 'true';
    const urlTimestamp = urlParams.get('ts');
    
    // Validate timestamp is recent (last 5 minutes)
    let isUrlAuthValid = false;
    if (isUrlAuthenticated && urlTimestamp) {
      const now = Date.now();
      const timestamp = parseInt(urlTimestamp, 10);
      const fiveMinutesMs = 5 * 60 * 1000;
      isUrlAuthValid = !isNaN(timestamp) && (now - timestamp < fiveMinutesMs);
      console.log('PrivateRoute - URL authentication found:', { isUrlAuthenticated, timestamp, isValid: isUrlAuthValid });
    }
    
    // If URL has valid auth params, immediately set flags in both storage types
    if (isUrlAuthValid) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('lastAuthTime', urlTimestamp);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('lastAuthTime', urlTimestamp);
    }
    
    const isLocalAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isSessionAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
    
    // Also check for Supabase session
    let hasSupabaseSession = false;
    try {
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase') && key.includes('session')) {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session && session.access_token) {
                hasSupabaseSession = true;
                break;
              }
            } catch (e) {
              console.log('Error parsing session data', e);
            }
          }
        }
      }
      
      // If not found in localStorage, check sessionStorage
      if (!hasSupabaseSession) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.includes('supabase') && key.includes('session')) {
            const sessionData = sessionStorage.getItem(key);
            if (sessionData) {
              try {
                const session = JSON.parse(sessionData);
                if (session && session.access_token) {
                  hasSupabaseSession = true;
                  break;
                }
              } catch (e) {
                console.log('Error parsing session data', e);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error checking Supabase session:', e);
    }
    
    const isAuthenticated = isUrlAuthValid || isLocalAuthenticated || isSessionAuthenticated || hasSupabaseSession;
    setIsLocallyAuthenticated(isAuthenticated);
    setLocalAuthChecked(true);
    console.log('PrivateRoute - Local auth check result:', { 
      isUrlAuthValid,
      isLocalAuthenticated, 
      isSessionAuthenticated, 
      hasSupabaseSession,
      isAuthenticated 
    });

    // If authenticated via URL, clean up the URL by removing the auth params
    if (isUrlAuthValid && isAuthenticated) {
      // Use history.replaceState to remove the query parameters without a page reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
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