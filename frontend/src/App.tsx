import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/theme-provider';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { Toaster } from './components/ui/toaster';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AuditDetailContainer from './pages/AuditDetailContainer';
import NotFound from './pages/NotFound';
import SupabaseConfig from './pages/SupabaseConfig';
import TestPage from './pages/TestPage';
import Profile from './pages/Profile';

// Layout component that conditionally renders Navbar and container
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDashboardPage = location.pathname === '/dashboard' || location.pathname === '/';
  
  return (
    <div className="min-h-screen bg-background">
      {isAuthPage ? (
        // Auth pages render without navbar or container padding
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/supabase-config" element={<SupabaseConfig />} />
          <Route path="/test" element={<TestPage />} />
              
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/audit/:id" element={<AuditDetailContainer />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
              
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      ) : (
        // All other pages use the standard layout with navbar
        <div className="flex flex-col h-screen">
          <Navbar />
          {isDashboardPage ? (
            // Dashboard uses full width
            <main className="flex-1 overflow-y-auto py-4">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          ) : (
            // All other pages use the container with padding
            <main className="flex-1 overflow-y-auto container py-4">
              <Routes>
                <Route path="/supabase-config" element={<SupabaseConfig />} />
                <Route path="/test" element={<TestPage />} />
                  
                <Route element={<PrivateRoute />}>
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/audit/:id" element={<AuditDetailContainer />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
                  
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          )}
        </div>
      )}
      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="audit-my-model-theme">
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
