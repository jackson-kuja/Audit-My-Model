import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { User, PanelRight } from 'lucide-react';
import { Tooltip as TooltipPrimitive } from '@mui/material';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if currently on the profile or upload page
  const isOnProfile = location.pathname === '/profile';
  const isOnUpload = location.pathname === '/upload';
  const shouldShowDashboardIcon = isOnProfile || isOnUpload;

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={user ? '/dashboard' : '/'} 
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <span className="hidden sm:inline-block">Audit My Model</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {user ? (
            shouldShowDashboardIcon ? (
              <TooltipPrimitive title="Go to Dashboard" arrow>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-8 w-8 rounded-full"
                  onClick={() => navigate('/dashboard')}
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </TooltipPrimitive>
            ) : (
              <TooltipPrimitive title="Go to Profile" arrow>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-8 w-8 rounded-full"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-4 w-4" />
                </Button>
              </TooltipPrimitive>
            )
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/register')}>
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar; 