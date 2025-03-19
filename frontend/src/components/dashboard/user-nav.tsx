import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, Menu, MenuItem, Divider, Typography } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

export function UserNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    handleClose();
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };
  
  const open = Boolean(anchorEl);
  
  return (
    <>
      <Button
        onClick={handleClick}
        size="small"
        sx={{ borderRadius: '50%', minWidth: 40, width: 40, height: 40, p: 0 }}
      >
        <Avatar sx={{ width: 40, height: 40 }}>
          {user?.email ? user.email.substring(0, 2).toUpperCase() : <AccountCircle />}
        </Avatar>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <div style={{ padding: '8px 16px' }}>
          <Typography variant="subtitle1">
            {user?.email?.split('@')[0] || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </div>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/profile')}>Profile</MenuItem>
        <MenuItem onClick={() => handleNavigate('/upload')}>New Audit</MenuItem>
        <MenuItem onClick={() => handleNavigate('/dashboard')}>Dashboard</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </>
  );
} 