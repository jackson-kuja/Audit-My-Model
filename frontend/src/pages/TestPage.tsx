import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { supabase } from '../utils/supabase';

const TestPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const navigate = useNavigate();

  // Check Supabase session directly for comparison
  const checkSupabaseSession = async () => {
    try {
      console.log('TestPage - Checking Supabase session directly');
      setSessionLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('TestPage - Error getting Supabase session:', error);
      } else {
        console.log('TestPage - Direct Supabase session data:', data);
        setSessionInfo(data);
      }
    } catch (err) {
      console.error('TestPage - Exception getting Supabase session:', err);
    } finally {
      setSessionLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  };

  // Initial session check
  useEffect(() => {
    checkSupabaseSession();
    // Set up refreshing every 5 seconds to see changes
    const interval = setInterval(() => {
      checkSupabaseSession();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const forceLogin = async () => {
    try {
      console.log('TestPage - Forcing login with hardcoded credentials');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jackson.kuja@me.com',
        password: 'asdfasdf'
      });
      
      if (error) {
        console.error('TestPage - Force login error:', error);
      } else {
        console.log('TestPage - Force login successful:', data);
        // Let the auth state update naturally via listener
      }
    } catch (err) {
      console.error('TestPage - Exception in force login:', err);
    }
  };

  const forceLogout = async () => {
    try {
      console.log('TestPage - Forcing logout');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('TestPage - Force logout error:', error);
      } else {
        console.log('TestPage - Force logout successful');
      }
    } catch (err) {
      console.error('TestPage - Exception in force logout:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-2">Authentication Test Page</h1>
      <p className="text-lg mb-4">Last refreshed: {lastRefreshed}</p>
      
      <div className="mb-6 p-4 w-full max-w-2xl bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Authentication Status:</h2>
        
        <div className={`p-4 rounded mb-4 ${user ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className="font-bold text-lg">
            {loading ? '⏳ Checking authentication...' : user ? '✅ Authenticated' : '❌ Not Authenticated'}
          </p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded mb-4">
          <p className="font-semibold">Context State:</p>
          <p className="text-sm mb-1">Loading: {loading ? 'true' : 'false'}</p>
          <p className="text-sm mb-2">User: {user ? `${user.email} (${user.id})` : 'null'}</p>
          <pre className="overflow-auto max-h-40 bg-gray-200 p-2 text-xs rounded">
            {loading ? 'Loading...' : user ? JSON.stringify(user, null, 2) : 'No user data'}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <p className="font-semibold">Direct Supabase Session:</p>
          <p className="text-sm mb-2">Session: {sessionInfo?.session ? 'Active' : 'None'}</p>
          <pre className="overflow-auto max-h-40 bg-gray-200 p-2 text-xs rounded">
            {sessionLoading ? 'Loading...' : 
             sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'No session info'}
          </pre>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button onClick={checkSupabaseSession} className="w-full">
          Refresh Session Info
        </Button>
        
        <Button onClick={navigateToDashboard} className="w-full">
          Go to Dashboard
        </Button>
        
        <div className="flex gap-4 w-full">
          <Button onClick={forceLogin} variant="outline" className="w-full">
            Force Login
          </Button>
          
          <Button onClick={forceLogout} variant="destructive" className="w-full">
            Force Logout
          </Button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Debug Links:</p>
          <div className="flex flex-col gap-2">
            <a href="/login" className="text-blue-500 hover:underline">Login Page</a>
            <a href="/signup" className="text-blue-500 hover:underline">Sign up Page</a>
            <a href="/dashboard" className="text-blue-500 hover:underline">Dashboard Page</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 