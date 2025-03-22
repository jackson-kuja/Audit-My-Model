import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

// A wrapper for layout consistency
const PageWithNavbar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col h-screen">
    <Navbar />
    <main className="flex-1 overflow-y-auto container py-4">
      {children}
    </main>
  </div>
);

// Dashboard has a special layout
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col h-screen">
    <Navbar />
    <main className="flex-1 overflow-y-auto py-4">
      {children}
    </main>
  </div>
);

// Higher-order component to force redirects based on auth state
function AuthRouteGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('App - AuthRouteGuard checking auth state:', { user, loading, path: location.pathname });

    // If auth check complete and user is logged in, redirect away from public pages
    const publicPaths = ['/login', '/signup', '/supabase-config', '/test', '/'];
    if (!loading && user && publicPaths.includes(location.pathname)) {
      console.log('App - Authenticated user on public page, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }

    // If auth check complete and user is NOT logged in, redirect away from protected pages
    const protectedPathPrefixes = ['/dashboard', '/audit', '/profile', '/upload'];
    const isProtectedPath = protectedPathPrefixes.some(prefix =>
      location.pathname.startsWith(prefix)
    );

    if (!loading && !user && isProtectedPath) {
      console.log('App - Unauthenticated user on protected page, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
}

const App: React.FC = () => {
  console.log('App rendering');

  return (
    <ThemeProvider defaultTheme="system" storageKey="audit-my-model-theme">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            {/* Add route guard that runs on every render and navigation */}
            <AuthRouteGuard />

            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/supabase-config" element={<SupabaseConfig />} />
              <Route path="/test" element={<TestPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </PrivateRoute>
              } />

              <Route path="/upload" element={
                <PrivateRoute>
                  <PageWithNavbar>
                    <Upload />
                  </PageWithNavbar>
                </PrivateRoute>
              } />

              <Route path="/audit/:id" element={
                <PrivateRoute>
                  <PageWithNavbar>
                    <AuditDetailContainer />
                  </PageWithNavbar>
                </PrivateRoute>
              } />

              <Route path="/profile" element={
                <PrivateRoute>
                  <PageWithNavbar>
                    <Profile />
                  </PageWithNavbar>
                </PrivateRoute>
              } />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
