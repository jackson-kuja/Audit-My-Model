import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// A wrapper for layout consistency
function PageWithNavbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-y-auto container py-4">
        {children}
      </main>
    </div>
  );
}

// Dashboard has a special layout
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-y-auto py-4">
        {children}
      </main>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="audit-my-model-theme">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/supabase-config" element={<SupabaseConfig />} />
              <Route path="/test" element={<TestPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/upload"
                element={
                  <PrivateRoute>
                    <PageWithNavbar>
                      <Upload />
                    </PageWithNavbar>
                  </PrivateRoute>
                }
              />

              <Route
                path="/audit/:id"
                element={
                  <PrivateRoute>
                    <PageWithNavbar>
                      <AuditDetailContainer />
                    </PageWithNavbar>
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <PageWithNavbar>
                      <Profile />
                    </PageWithNavbar>
                  </PrivateRoute>
                }
              />

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
