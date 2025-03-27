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
import { useSubscription } from '../context/SubscriptionContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';

// Add the badge property to the interface
interface NavItem {
  text: string;
  path: string;
  badge?: string;
}

const Header = () => {
  const { user, logout } = useAuth();
  const { isPro } = useSubscription();
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
      width: '100%', 
      py: 2,
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      backgroundColor: 'transparent'
    }}>
      <Container 
        maxWidth="xl" 
        sx={{ 
          px: { xs: 2, sm: 3 }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 100,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}
        >
          <Toolbar disableGutters sx={{ 
            height: 56, 
            px: { xs: 2, md: 3 },
            justifyContent: 'space-between'
          }}>
            {/* Logo - always visible */}
            <Box 
              component={RouterLink} 
              to="/"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none',
                color: 'inherit',
                flexShrink: 0 // Prevent logo from shrinking
              }}
            >
              {/* Add the logo image */}
              <img 
                src="/AuditMyFile.png" 
                alt="Audit My File Logo" 
                style={{ 
                  height: '24px', 
                  width: 'auto', 
                  marginRight: '8px' 
                }} 
              />
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
                Audit My File
                {isPro && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Pro
                  </Box>
                )}
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
                      <AddIcon fontSize="small" style={{ marginRight: '4px' }} />
                      New Audit
                    </Button>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Get Pro Button (only for non-Pro users who are logged in) */}
                  {user && !isPro && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/profile')}
                      sx={{
                        borderRadius: 100,
                        borderColor: 'rgba(99, 102, 241, 0.5)',
                        px: 1.5,
                        py: 0.5,
                        mr: 1.5,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(99, 102, 241, 0.04)',
                        }
                      }}
                    >
                      Get Pro
                      <Box component="span" sx={{ 
                        fontSize: '0.65rem', 
                        ml: 0.5, 
                        color: 'text.secondary',
                        maxWidth: 80,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        (unlimited audits)
                      </Box>
                    </Button>
                  )}

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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Logo should appear on mobile too */}
                <Box
                  component={RouterLink}
                  to="/"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    flexShrink: 0 // Prevent logo from shrinking
                  }}
                >
                  <img
                    src="/AuditMyFile.png"
                    alt="Audit My File Logo"
                    style={{
                      height: '24px',
                      width: 'auto',
                      marginRight: '4px'
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    Audit My File
                    {isPro && (
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#ffffff',
                          background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Pro
                      </Box>
                    )}
                  </Typography>
                </Box>

                {/* The rest of the mobile menu with New Audit button and navigation icons */}
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
                      <AddIcon fontSize="small" style={{ marginRight: '4px' }} />
                      New Audit
                    </Button>
                  )}

                  {/* Direct navigation icons for mobile */}
                  {user ? (
                    <>
                      {/* Get Pro Button (only for non-Pro users in mobile) */}
                      {!isPro && (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate('/profile')}
                          sx={{
                            borderRadius: 100,
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            px: 1.2,
                            py: 0.4,
                            mr: 1,
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'rgba(99, 102, 241, 0.04)',
                            }
                          }}
                        >
                          Get Pro
                        </Button>
                      )}
                      
                      {shouldShowDashboardIcon ? (
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
                      )}
                    </>
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
              </Box>
            )}
          </Toolbar>
        </Paper>
      </Container>
    </Box>
  );
};

export default Header;
