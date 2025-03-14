import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables or localStorage
const getSupabaseClient = () => {
  // First try to get from environment variables
  let supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  let supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  // If not available in env, try localStorage
  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseUrl = localStorage.getItem('supabase_url');
    supabaseAnonKey = localStorage.getItem('supabase_anon_key');
  }

  // If still not available, return null
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Please configure in the Supabase Config page.');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const supabase = getSupabaseClient();

export default supabase;
