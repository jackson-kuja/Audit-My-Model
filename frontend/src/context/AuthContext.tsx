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

  // Helper: load user profile from 'profiles' table or user object
  const loadUserProfile = async (sessionUser: any): Promise<User> => {
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

      if (!profileError && data) {
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

  // Initialize auth state
  useEffect(() => {
    console.log("[AuthContext] Initializing auth state...");

    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session?.user) {
          // We have an active session
          console.log("[AuthContext] Found existing session user:", session.user.email);
          const profileUser = await loadUserProfile(session.user);
          setUser(profileUser);
        } else {
          console.log("[AuthContext] No existing session found, user is null");
          setUser(null);
        }
      } catch (err) {
        console.error("[AuthContext] getInitialSession error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] onAuthStateChange event:", event);
      setLoading(true);

      if (session?.user) {
        // Build up user from profiles
        const newUser = await loadUserProfile(session.user);
        setUser(newUser);
        console.log("[AuthContext] onAuthStateChange => user is set:", newUser.email);
      } else {
        console.log("[AuthContext] onAuthStateChange => no user, setting user to null");
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
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
        setLoading(false);
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
        setLoading(false);
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
