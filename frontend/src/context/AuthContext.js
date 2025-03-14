import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import supabase from '../utils/supabase';

// Create the auth context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check for existing session on mount
  useEffect(() => {
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchUserProfile(session);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    // Initial session check
    checkCurrentSession();
    
    // Cleanup the subscription on unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  // Check if user has an active session
  const checkCurrentSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data && data.session) {
        fetchUserProfile(data.session);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking current session:', error);
      setLoading(false);
    }
  };
  
  // Fetch user profile information after authentication
  const fetchUserProfile = async (session) => {
    try {
      // Set axios auth header for subsequent API calls
      axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      
      // Try to fetch profile from Supabase
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!error && data) {
          // Profile exists, combine auth data with profile data
          const userWithProfile = {
            ...session.user,
            first_name: data?.first_name || '',
            last_name: data?.last_name || '',
            is_paid: data?.is_paid || false,
            subscription_end_date: data?.subscription_end_date || null
          };
          
          setUser(userWithProfile);
          setLoading(false);
          return;
        }
      } catch (profileError) {
        console.warn('Profiles table may not exist yet:', profileError);
        // Continue execution even if profiles table doesn't exist
      }
      
      // If we get here, either the profiles table doesn't exist or the user doesn't have a profile
      // Create a basic user object from the session
      const basicUserProfile = {
        ...session.user,
        first_name: '',
        last_name: '',
        is_paid: false,
        subscription_end_date: null
      };
      
      setUser(basicUserProfile);
    } catch (error) {
      console.error('Error handling user authentication:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Set user information immediately after successful login
      if (data && data.user) {
        // We don't need to set the user state here as it will be handled by the onAuthStateChange listener
        console.log('User logged in successfully:', data.user.email);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.'
      };
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });
      
      if (authError) throw authError;
      
      // Check if email confirmation is required
      if (authData?.user && !authData.user.confirmed_at && !authData.user.email_confirmed_at) {
        // User created but needs email confirmation
        return { 
          success: true, 
          needsEmailConfirmation: true,
          message: 'Registration successful! Please check your email to confirm your account.'
        };
      }
      
      // Create a profile record in the profiles table
      if (authData?.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: authData.user.id, 
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                is_paid: false,
                created_at: new Date()
              }
            ]);
            
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Still return success since auth worked
            return { 
              success: true, 
              message: 'Account created but profile setup encountered an issue.'
            };
          }
        } catch (profileErr) {
          console.error('Profile creation exception:', profileErr);
          // Still return success since auth worked
          return { 
            success: true, 
            message: 'Account created but profile setup encountered an issue.'
          };
        }
      }
      
      return { success: true, message: 'Registration successful!' };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // Remove authorization header
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Update user information
  const updateUserInfo = async (updatedUser) => {
    try {
      // Update the user's metadata in Supabase Auth
      if (user) {
        // Update profile in database
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            is_paid: updatedUser.is_paid,
            subscription_end_date: updatedUser.subscription_end_date
          })
          .eq('id', user.id);
          
        if (error) throw error;
        
        // Update local state
        setUser({...user, ...updatedUser});
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating user info:', error);
      return { success: false, message: error.message };
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
