import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/index';
import { supabase } from '../utils/supabase';

// Define AuthContextType
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  loading: true,
  error: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced function to create a user object from session data and profile data
  const createUserFromSession = async (sessionUser: any): Promise<User> => {
    const baseUser = {
      id: sessionUser.id,
      email: sessionUser.email || '',
      created_at: sessionUser.created_at || new Date().toISOString(),
      updated_at: sessionUser.updated_at || new Date().toISOString(),
      is_paid: false,
      user_metadata: sessionUser.user_metadata || {},
      app_metadata: sessionUser.app_metadata || {}
    };

    try {
      // Fetch profile data from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile data:', error);
        return baseUser;
      }
      
      if (data) {
        // Merge profile data with base user data
        return {
          ...baseUser,
          first_name: data.first_name,
          last_name: data.last_name,
          preferred_email: data.preferred_email,
          is_paid: data.is_paid,
          subscription_end_date: data.subscription_end_date
        };
      }
      
      return baseUser;
    } catch (err) {
      console.error('Error in profile data processing:', err);
      return baseUser;
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    console.log('AuthProvider mounted - initializing auth state');
    
    // Function to handle auth state change
    const handleAuthChange = async (event: string, session: any) => {
      console.log('AuthContext - Auth state changed:', event);
      console.log('AuthContext - Session:', session ? 'Present' : 'Null');
      
      setLoading(true);
      
      if (session) {
        console.log('AuthContext - Session found, setting user state', session);
        const userData = await createUserFromSession(session.user);
        console.log('AuthContext - Created user data:', userData);
        setUser(userData);
        console.log('AuthContext - User state updated');
      } else {
        console.log('AuthContext - No session, clearing user state');
        setUser(null);
      }
      
      setLoading(false);
    };

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Getting initial session');
        const { data } = await supabase.auth.getSession();
        await handleAuthChange('INITIAL_SESSION', data.session);
      } catch (err) {
        console.error('Error getting initial session:', err);
        setUser(null);
        setLoading(false);
      }
    };

    // Call initialize
    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        await handleAuthChange(event, session);
      }
    );

    // Cleanup
    return () => {
      if (authListener && authListener.subscription) {
        console.log('Cleaning up auth listener');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Logging in with email:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) throw signInError;
      
      console.log('Login successful');
      
      // After successful login, the onAuthStateChange handler will update the user state
      // but we'll also update it immediately for faster UI response
      if (data && data.user) {
        const userData = await createUserFromSession(data.user);
        setUser(userData);
        
        // Force immediate navigation to dashboard
        console.log('AuthContext - Login successful, forcing navigation to dashboard');
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in');
      throw err;
    }
  };

  // Register function
  const register = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Registering with email:', email);
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (signUpError) throw signUpError;

      console.log('Registration successful');
      
      // After successful registration, we should have a session and user
      if (data && data.user) {
        const userData = await createUserFromSession(data.user);
        setUser(userData);
        
        // Force immediate navigation to dashboard
        console.log('AuthContext - Registration successful, forcing navigation to dashboard');
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      console.log('Logging out');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('Logout successful');
      
      // The onAuthStateChange handler will clear the user state
      // but we'll also clear it immediately for faster UI response
      setUser(null);
      
      // Redirect handled by components that use useAuth
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to log out');
    }
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);
