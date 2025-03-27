import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../utils/supabase";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

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
  const [initialized, setInitialized] = useState(false);

  // Helper: load user profile from 'profiles' table or user object
  const loadUserProfile = async (sessionUser: any): Promise<User | null> => {
    if (!sessionUser) return null;
    
    const baseUser: User = {
      id: sessionUser.id,
      email: sessionUser.email || "",
      created_at: sessionUser.created_at || new Date().toISOString(),
      updated_at: sessionUser.updated_at || new Date().toISOString(),
      user_metadata: sessionUser.user_metadata || {},
      app_metadata: sessionUser.app_metadata || {},
    };

    try {
      // Attempt to load from "profiles" table for additional fields
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (profileError) {
        console.warn("[AuthContext] Profile fetch error:", profileError.message);
        
        // Check if error is due to missing profile (no rows)
        if (profileError.message.includes("JSON object requested, multiple (or no) rows returned")) {
          console.log("[AuthContext] Profile not found, creating new profile for user:", sessionUser.id);
          
          // Create a new profile record
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({ 
              id: sessionUser.id, 
              email: sessionUser.email 
            })
            .select("*")
            .single();
            
          if (insertError) {
            console.error("[AuthContext] Error creating profile:", insertError);
            return baseUser;
          }
          
          console.log("[AuthContext] Profile created successfully:", newProfile);
          
          // Return the newly created profile with base user data
          if (newProfile) {
            return {
              ...baseUser,
              first_name: newProfile.first_name,
              last_name: newProfile.last_name,
              preferred_email: newProfile.preferred_email,
              is_paid: newProfile.is_paid,
              subscription_end_date: newProfile.subscription_end_date,
            };
          }
        }
        
        return baseUser;
      }
      
      if (data) {
        return {
          ...baseUser,
          first_name: data.first_name,
          last_name: data.last_name,
          preferred_email: data.preferred_email,
          is_paid: data.is_paid,
          subscription_end_date: data.subscription_end_date,
        };
      }
      return baseUser;
    } catch (err) {
      console.error("[AuthContext] loadUserProfile error:", err);
      return baseUser;
    }
  };

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;
    console.log("[AuthContext] Initializing auth state...");

    const getInitialSession = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        // Explicitly get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthContext] Session fetch error:", error);
          throw error;
        }
        
        const session = data.session;
        
        if (session?.user) {
          console.log("[AuthContext] Found existing session user:", session.user.email);
          
          try {
            const profileUser = await loadUserProfile(session.user);
            if (mounted) setUser(profileUser);
          } catch (profileErr) {
            console.error("[AuthContext] Profile load error:", profileErr);
            if (mounted) setUser(null);
          }
        } else {
          console.log("[AuthContext] No existing session found, user is null");
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error("[AuthContext] getInitialSession error:", err);
        if (mounted) {
          setUser(null);
          setError("Failed to restore session");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] onAuthStateChange event:", event);
      
      if (!mounted) return;
      if (!initialized) return; // Skip if initial load is still in progress

      setLoading(true);

      try {
        if (session?.user) {
          const profileUser = await loadUserProfile(session.user);
          if (mounted) setUser(profileUser);
          console.log("[AuthContext] onAuthStateChange => user is set:", profileUser?.email);
        } else {
          console.log("[AuthContext] onAuthStateChange => no user, setting user to null");
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error("[AuthContext] Error in auth state change handler:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    // Start the process
    getInitialSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log("[AuthContext] login start:", email);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("[AuthContext] login error:", authError);
        setError(authError.message);
        throw authError;
      }

      // We do NOT manually setUser here since onAuthStateChange will handle it
      console.log("[AuthContext] login success => waiting for onAuthStateChange...");
    } catch (err: any) {
      console.error("[AuthContext] login exception:", err);
      setError(err?.message || "Failed to log in");
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
      console.log("[AuthContext] register start:", email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("[AuthContext] register error:", authError);
        setError(authError.message);
        throw authError;
      }

      console.log("[AuthContext] register success => waiting for onAuthStateChange...");
    } catch (err: any) {
      console.error("[AuthContext] register exception:", err);
      setError(err?.message || "Failed to register");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("[AuthContext] Logging out...");
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error("[AuthContext] logout error:", signOutError);
        setError(signOutError.message);
      } else {
        console.log("[AuthContext] logout success => user set to null");
        setUser(null);
      }
    } catch (err: any) {
      console.error("[AuthContext] logout exception:", err);
      setError(err?.message || "Failed to log out");
    } finally {
      setLoading(false);
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
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
