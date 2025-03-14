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
  Menu,
  MenuItem,
  Paper
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMobileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMobileMenuClose();
  };

  // Navigation items
  const navItems = [
    { text: 'Pricing', path: '/subscription' },
    { text: 'News', path: '#' },
    { text: 'Careers', path: '#' }
  ];

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
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(user ? '/upload' : '/register')}
                    sx={{
                      borderRadius: 100,
                      boxShadow: 'none',
                      px: 2.5,
                      py: 0.75,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      backgroundColor: '#acebb5',
                      color: '#000',
                      '&:hover': {
                        backgroundColor: '#98d6a1'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </Box>
              </>
            ) : (
              // Mobile Navigation
              <Box>
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMobileMenuOpen}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="mobile-menu"
                  anchorEl={mobileMenuAnchorEl}
                  keepMounted
                  open={Boolean(mobileMenuAnchorEl)}
                  onClose={handleMobileMenuClose}
                >
                  {navItems.map((item) => (
                    <MenuItem key={item.text} onClick={() => handleNavigation(item.path)}>
                      {item.text} {item.badge && <span style={{ marginLeft: 5, fontSize: '0.8rem' }}>{item.badge}</span>}
                    </MenuItem>
                  ))}
                  <MenuItem>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => {
                        handleNavigation(user ? '/upload' : '/register');
                      }}
                      sx={{
                        borderRadius: 100,
                        textTransform: 'none',
                        backgroundColor: '#acebb5',
                        color: '#000',
                        '&:hover': {
                          backgroundColor: '#98d6a1'
                        }
                      }}
                    >
                      Get Started
                    </Button>
                  </MenuItem>
                  {user && (
                    <>
                      <MenuItem onClick={() => handleNavigation('/dashboard')}>
                        My Audits
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/profile')}>
                        Profile
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </>
                  )}
                  {!user && (
                    <>
                      <MenuItem onClick={() => handleNavigation('/login')}>Login</MenuItem>
                      <MenuItem onClick={() => handleNavigation('/register')}>Register</MenuItem>
                    </>
                  )}
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Paper>
      </Container>
    </Box>
  );
};

export default Header;
