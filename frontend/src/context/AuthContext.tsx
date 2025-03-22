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

  // Function to create a user object from session data and additional profile data
  const createUserFromSession = async (sessionUser: any): Promise<User> => {
    const baseUser: User = {
      id: sessionUser.id,
      email: sessionUser.email || '',
      created_at: sessionUser.created_at || new Date().toISOString(),
      updated_at: sessionUser.updated_at || new Date().toISOString(),
      user_metadata: sessionUser.user_metadata || {},
      app_metadata: sessionUser.app_metadata || {}
    };

    try {
      // Attempt to load profile row from 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (!error && data) {
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
      console.error('[AuthContext] Error in profile fetch:', err);
      return baseUser;
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    console.log('[AuthContext] Initializing auth state');

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event);
      setLoading(true);

      if (session?.user) {
        const newUserData = await createUserFromSession(session.user);
        setUser(newUserData);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Function to fetch the current session
    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const { session } = data;

        if (session?.user) {
          // We have an active session
          const userData = await createUserFromSession(session.user);
          setUser(userData);
        } else {
          // No session
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        const userData = await createUserFromSession(data.user);
        setUser(userData);
      }
    } catch (err: any) {
      console.error('[AuthContext] Login error:', err);
      setError(err.message || 'Failed to log in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user) {
        const userData = await createUserFromSession(data.user);
        setUser(userData);
      }
    } catch (err: any) {
      console.error('[AuthContext] Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (err: any) {
      console.error('[AuthContext] Logout error:', err);
      setError(err.message || 'Failed to log out');
    }
  };

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
