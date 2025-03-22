import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Component that handles redirect for authenticated users on public pages
 * It will redirect to dashboard if a user is already authenticated
 */
export function AuthRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthRedirect - Checking if user should be redirected', { user, loading });
    
    if (user && !loading) {
      console.log('AuthRedirect - User is authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      
      // Fallback using direct browser navigation
      setTimeout(() => {
        console.log('AuthRedirect - Fallback redirect using window.location');
        window.location.href = '/dashboard';
      }, 500);
    }
  }, [user, loading, navigate]);

  return null; // This component doesn't render anything
}
