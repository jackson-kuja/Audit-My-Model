import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadFile from './pages/UploadFile';
// eslint-disable-next-line no-unused-vars
import AuditDetails from './pages/AuditDetails';
import AuditDetail from './pages/AuditDetail';
import NewAudit from './pages/NewAudit';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import SupabaseConfig from './pages/SupabaseConfig';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
// eslint-disable-next-line no-unused-vars
import supabase from './utils/supabase';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Granola green color
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a5d6a7', // Light green
      light: '#d7ffd9',
      dark: '#75a478',
      contrastText: '#1b5e20',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#0a2815',
      secondary: '#60706a',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
      color: '#8a8a8a', // Light gray for "The" part
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
      color: '#2e7d32', // Dark green
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
      color: '#60706a', // Medium gray-green
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
      color: '#60706a', // Medium gray-green
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 24, // More rounded corners like Granola
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 6px 12px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 10px 20px rgba(0, 0, 0, 0.05)',
    '0px 12px 24px rgba(0, 0, 0, 0.05)',
    '0px 14px 28px rgba(0, 0, 0, 0.05)',
    '0px 16px 32px rgba(0, 0, 0, 0.05)',
    '0px 18px 36px rgba(0, 0, 0, 0.05)',
    '0px 20px 40px rgba(0, 0, 0, 0.05)',
    '0px 22px 44px rgba(0, 0, 0, 0.05)',
    '0px 24px 48px rgba(0, 0, 0, 0.05)',
    '0px 26px 52px rgba(0, 0, 0, 0.05)',
    '0px 28px 56px rgba(0, 0, 0, 0.05)',
    '0px 30px 60px rgba(0, 0, 0, 0.05)',
    '0px 32px 64px rgba(0, 0, 0, 0.05)',
    '0px 34px 68px rgba(0, 0, 0, 0.05)',
    '0px 36px 72px rgba(0, 0, 0, 0.05)',
    '0px 38px 76px rgba(0, 0, 0, 0.05)',
    '0px 40px 80px rgba(0, 0, 0, 0.05)',
    '0px 42px 84px rgba(0, 0, 0, 0.05)',
    '0px 44px 88px rgba(0, 0, 0, 0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100, // Fully rounded buttons like Granola
          padding: '10px 20px',
          fontWeight: 500,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#2e7d32',
        },
        containedSecondary: {
          backgroundColor: '#a5d6a7',
          color: '#0a2815',
        },
        outlined: {
          borderWidth: '1px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #f0f0f0',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          fontWeight: 500,
        },
      },
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Check if Supabase is configured
const RequireSupabaseConfig = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Check if Supabase credentials are available
    const checkConfiguration = () => {
      console.log('Checking Supabase configuration...');
      const url = process.env.REACT_APP_SUPABASE_URL || localStorage.getItem('supabase_url');
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');
      
      console.log('Supabase URL available:', !!url);
      console.log('Supabase Key available:', !!key);
      
      if (url && key) {
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
      }
      setChecking(false);
    };
    
    checkConfiguration();
  }, []);
  
  if (checking) {
    return <div>Checking Supabase configuration...</div>;
  }
  
  if (!isConfigured) {
    console.log('Supabase not configured, redirecting to config page');
    return <Navigate to="/supabase-config" replace />;
  }
  
  console.log('Supabase configured, rendering children');
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Supabase Configuration Route - Available without auth */}
          <Route path="/supabase-config" element={<SupabaseConfig />} />
          
          {/* All other routes require Supabase to be configured */}
          <Route path="*" element={
            <RequireSupabaseConfig>
              <AuthProvider>
                <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <Header />
                  <main style={{ flex: 1, margin: '0 auto', width: '100%' }}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/upload" element={
                        <ProtectedRoute>
                          <UploadFile />
                        </ProtectedRoute>
                      } />
                      <Route path="/audits/new" element={
                        <ProtectedRoute>
                          <NewAudit />
                        </ProtectedRoute>
                      } />
                      <Route path="/audits/:id" element={
                        <ProtectedRoute>
                          <AuditDetail />
                        </ProtectedRoute>
                      } />
                      <Route path="/subscription" element={
                        <ProtectedRoute>
                          <Subscription />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </AuthProvider>
            </RequireSupabaseConfig>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

