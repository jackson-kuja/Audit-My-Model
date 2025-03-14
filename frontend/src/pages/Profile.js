import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';

const Profile = () => {
  const { user, updateUserInfo } = useAuth();
  
  // User profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    preferredEmail: user?.preferred_email || user?.email || ''
  });
  
  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Form state
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        preferredEmail: user.preferred_email || user.email || ''
      });
    }
  }, [user]);
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Display snackbar notification
  const showNotification = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Submit profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess(false);
    
    try {
      // Update profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          preferred_email: profileData.preferredEmail
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update user info in context
      updateUserInfo({
        ...user,
        first_name: data.first_name,
        last_name: data.last_name,
        preferred_email: data.preferred_email
      });
      
      setProfileSuccess(true);
      showNotification('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError('Failed to update profile. Please try again.');
      showNotification('Failed to update profile. Please try again.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };
  
  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess(false);
    
    // Validate password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setPasswordLoading(false);
      return;
    }
    
    try {
      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      setPasswordSuccess(true);
      showNotification('Password updated successfully!');
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Failed to update password. Please try again.');
      showNotification('Failed to update password. Please try again.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // First delete the user's profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
          
        if (profileError) throw profileError;
        
        // Then delete the user's auth account
        const { error: authError } = await supabase.auth.admin.deleteUser(
          user.id
        );
        
        if (authError) throw authError;
        
        // Sign out the user
        await supabase.auth.signOut();
        
        // Redirect to home or login page
        window.location.href = '/';
      } catch (err) {
        console.error('Error deleting account:', err);
        showNotification('Failed to delete account. Please try again.', 'error');
      }
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Your Profile</Typography>
      
      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Account Information</Typography>
            
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile updated successfully!
              </Alert>
            )}
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleProfileSubmit} noValidate>
              <TextField
                margin="normal"
                fullWidth
                disabled
                id="email"
                label="Email Address (Login)"
                name="email"
                value={user?.email || ''}
                helperText="This is your account email used for login"
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="preferredEmail"
                label="Preferred Email (Work)"
                name="preferredEmail"
                value={profileData.preferredEmail}
                onChange={handleProfileChange}
                helperText="This email will be used for communications and report delivery"
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileChange}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
              />
              
              <TextField
                margin="normal"
                fullWidth
                disabled
                id="planType"
                label="Subscription Plan"
                name="planType"
                value={user?.is_paid ? 'Premium' : 'Free'}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={profileLoading}
              >
                {profileLoading ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Change Password</Typography>
            
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password updated successfully!
              </Alert>
            )}
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
              {/* Note: Supabase doesn't require the current password when changing it with a valid session */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                helperText="Password must be at least 6 characters"
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={passwordLoading}
              >
                {passwordLoading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Account Section */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" color="error">Danger Zone</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" paragraph>
          Deleting your account will permanently remove all of your data, including your profile information and model audit history.
          This action cannot be undone.
        </Typography>
        <Button 
          variant="outlined" 
          color="error"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </Button>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
