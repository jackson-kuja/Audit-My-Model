import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';

// Import pages
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import AuditDetailContainer from './pages/AuditDetailContainer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import SupabaseConfig from './pages/SupabaseConfig';
import TestPage from './pages/TestPage';

// Layout component that conditionally renders Navbar and container
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDashboardPage = location.pathname === '/dashboard' || location.pathname === '/';
  
  return (
    <div className="min-h-screen bg-background">
      {!isAuthPage && <Navbar />}
      
      <main className={`flex-1 overflow-y-auto ${isDashboardPage ? 'py-4' : 'container py-4'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/supabase-config" element={<SupabaseConfig />} />
          <Route path="/test" element={<TestPage />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/audit/:id" element={<AuditDetailContainer />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
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
