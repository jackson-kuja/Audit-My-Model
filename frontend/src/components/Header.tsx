import React, { useState } from 'react';
import { 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  useMediaQuery,
  useTheme,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Add the badge property to the interface
interface NavItem {
  text: string;
  path: string;
  badge?: string;
}

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Navigation items
  const navItems: NavItem[] = user ? [
    { text: 'Dashboard', path: '/dashboard' }
  ] : [
    { text: 'Pricing', path: '/subscription' },
    { text: 'News', path: '#' },
    { text: 'Careers', path: '#' }
  ];

  // Check if currently on the profile or dashboard page
  const isOnProfile = location.pathname === '/profile';
  const isOnDashboard = location.pathname === '/dashboard';
  const isOnUpload = location.pathname === '/upload';
  const shouldShowDashboardIcon = isOnProfile || isOnUpload;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      width: '100%', 
      py: 2,
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      backgroundColor: 'transparent'
    }}>
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 100,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            maxWidth: '800px',
            mx: 'auto'
          }}
        >
          <Toolbar disableGutters sx={{ 
            height: 56, 
            px: { xs: 2, md: 3 },
            justifyContent: 'space-between'
          }}>
            {/* Logo */}
            <Box 
              component={RouterLink} 
              to="/"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  mr: 0.25
                }}
              >
                AuditMyModel
              </Typography>
              <Box 
                sx={{ 
                  height: 16, 
                  width: 2, 
                  bgcolor: theme.palette.primary.main,
                  ml: 1
                }} 
              />
            </Box>

            {/* Desktop Navigation */}
            {!isMobile ? (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}>
                  {navItems.map((item) => (
                    <Box key={item.text} sx={{ position: 'relative', mx: 1.5 }}>
                      <Button
                        color="inherit"
                        component={RouterLink}
                        to={item.path}
                        sx={{
                          color: 'text.primary',
                          fontWeight: 400,
                          fontSize: '0.95rem',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {item.text}
                      </Button>
                      {item.badge && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            top: -3,
                            right: -12,
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            bgcolor: 'transparent',
                          }}
                        >
                          {item.badge}
                        </Typography>
                      )}
                    </Box>
                  ))}

                  {/* New Audit Button for All Users */}
                  {user && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate('/upload')}
                      sx={{
                        borderRadius: 100,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        px: 2.5,
                        py: 0.75,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff',
                        fontWeight: 600,
                        ml: 2,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                          boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      New Audit
                    </Button>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* User Avatar & Menu */}
                  {user && (
                    <>
                      {shouldShowDashboardIcon ? (
                        <Tooltip title="Go to Dashboard">
                          <IconButton
                            onClick={() => navigate('/dashboard')}
                            size="small"
                            sx={{ ml: 1 }}
                          >
                            <DashboardIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Go to Profile">
                          <IconButton
                            onClick={() => navigate('/profile')}
                            size="small"
                            sx={{ ml: 1 }}
                          >
                            <AccountCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Box>
              </>
            ) : (
              // Mobile Navigation
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* New Audit Button for Mobile */}
                {user && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/upload')}
                    sx={{
                      borderRadius: 100,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      px: 1.5,
                      py: 0.5,
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      backgroundColor: theme.palette.primary.main,
                      color: '#fff',
                      fontWeight: 600,
                      mr: 1.5,
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      }
                    }}
                  >
                    New Audit
                  </Button>
                )}

                {/* Direct navigation icons for mobile */}
                {user ? (
                  shouldShowDashboardIcon ? (
                    <Tooltip title="Go to Dashboard">
                      <IconButton
                        edge="end"
                        color="inherit"
                        aria-label="dashboard"
                        onClick={() => navigate('/dashboard')}
                      >
                        <DashboardIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Go to Profile">
                      <IconButton
                        edge="end"
                        color="inherit"
                        aria-label="profile"
                        onClick={() => navigate('/profile')}
                      >
                        <AccountCircleIcon />
                      </IconButton>
                    </Tooltip>
                  )
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/login')}
                    sx={{
                      borderRadius: 100,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      px: 1.5,
                      py: 0.5,
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      backgroundColor: theme.palette.primary.main,
                      color: '#fff',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      }
                    }}
                  >
                    Get Started
                  </Button>
                )}
              </Box>
            )}
          </Toolbar>
        </Paper>
      </Container>
    </Box>
  );
};

export default Header;
