import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const getSupabaseConfig = () => {
  // Try to get from env first, then localStorage
  const url = process.env.REACT_APP_SUPABASE_URL || localStorage.getItem('supabase_url');
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');

  if (!url || !key) {
    console.error('Supabase configuration missing. Please check your environment variables or localStorage.');
    throw new Error('Supabase configuration missing. Please configure your Supabase URL and Anon Key.');
  }

  console.log('Supabase URL:', url.substring(0, 15) + '...');
  return { url, key };
};

// Create a single instance of the Supabase client
const createSupabaseClient = () => {
  try {
    const { url, key } = getSupabaseConfig();
    const client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        storageKey: 'supabase_auth_token',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'frontend'
        }
      }
    });
    
    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
  }
};

// Ensure we only create one instance
export const supabase = createSupabaseClient();
