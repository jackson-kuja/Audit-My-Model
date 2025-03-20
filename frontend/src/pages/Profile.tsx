import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import type { User } from '../types/index';
import { cn } from "../lib/utils";
import { useNavigate } from 'react-router-dom';
import auditService from '../services/auditService';
import { toast } from "../hooks/use-toast";

// UI Components
import {
  Container,
  Box,
  Typography,
  Grid,
  Alert,
  Divider as MuiDivider
} from '@mui/material';
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';

// Define the schema for profile form
const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(2, {
      message: "First name must be at least 2 characters.",
    })
    .max(30, {
      message: "First name must not be longer than 30 characters.",
    }),
  lastName: z
    .string()
    .min(2, {
      message: "Last name must be at least 2 characters.",
    })
    .max(30, {
      message: "Last name must not be longer than 30 characters.",
    }),
  preferredEmail: z
    .string({
      required_error: "Please provide a preferred email for notifications.",
    })
    .email(),
});

// Define schema for password change
const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Define schema for notification settings
const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  securityEmails: z.boolean().default(true),
});

// Define schema for subscription settings
const subscriptionFormSchema = z.object({
  userTier: z.enum(['free', 'paid']),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;
type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

// Navigation items for settings
const settingsNavItems = [
  {
    title: "Profile",
    id: "profile"
  },
  {
    title: "Password",
    id: "password"
  },
  {
    title: "Notifications",
    id: "notifications"
  },
  {
    title: "Subscription",
    id: "subscription"
  },
  {
    title: "Danger Zone",
    id: "danger"
  }
];

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle not logged in state
  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning">
            Please sign in to view your profile.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <Grid container spacing={4}>
        {/* Settings Navigation */}
        <Grid item xs={12} md={3}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground mb-4">
            Manage your account preferences
          </p>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {settingsNavItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "outline"}
                className="justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                {item.title}
              </Button>
            ))}
            <Separator className="my-2" />
            <Button
              variant="outline"
              className="justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Grid>
        
        {/* Content Area */}
        <Grid item xs={12} md={9}>
          <div className="mt-0">
            {activeTab === "profile" && <ProfileSection user={user} />}
            {activeTab === "password" && <PasswordSection user={user} />}
            {activeTab === "notifications" && <NotificationsSection user={user} />} 
            {activeTab === "subscription" && <SubscriptionSection user={user} />}
            {activeTab === "danger" && <DangerZoneSection user={user} />}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// Profile Information Section
const ProfileSection: React.FC<{ user: User }> = ({ user }) => {
  // Default values for profile form
  const defaultValues: Partial<ProfileFormValues> = {
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    preferredEmail: user?.preferred_email || user?.email || '',
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Update user in the database
      const { error } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          preferred_email: data.preferredEmail
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium">Profile Information</h3>
        <p className="text-sm text-muted-foreground">
          This information will be displayed publicly so be careful what you share.
        </p>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Grid>
          </Grid>

          <FormField
            control={form.control}
            name="preferredEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Your email for notifications" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This email will be used for notifications. Your primary email ({user.email}) cannot be changed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit">Update profile</Button>
        </form>
      </Form>
    </div>
  );
};

// Password Change Section
const PasswordSection: React.FC<{ user: User }> = ({ user }) => {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      // Update password through Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) {
        throw error;
      }
      
      // Clear password fields
      form.reset();
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
    } catch (err) {
      console.error('Error updating password:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update password',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium">Change Password</h3>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure.
        </p>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit">Update Password</Button>
        </form>
      </Form>
    </div>
  );
};

// Notifications Section
const NotificationsSection: React.FC<{ user: User }> = ({ user }) => {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      marketingEmails: false,
      securityEmails: true,
    },
  });

  const onSubmit = async (data: NotificationsFormValues) => {
    try {
      // Update notification preferences through auth API
      const { error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata as Record<string, any>),
          notification_preferences: data
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been updated successfully."
      });
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update notification preferences',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications.
        </p>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Email Notifications
                    </FormLabel>
                    <FormDescription>
                      Receive email notifications about your account activity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="marketingEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Marketing Emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="securityEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Security Emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about your account security and activity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit">Update Notification Preferences</Button>
        </form>
      </Form>
    </div>
  );
};

// Subscription Section
const SubscriptionSection: React.FC<{ user: User }> = ({ user }) => {
  // Default values for subscription form
  const defaultValues: SubscriptionFormValues = {
    userTier: user?.user_tier || user?.user_metadata?.user_tier || 'free',
  };

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: SubscriptionFormValues) => {
    try {
      // Update user in the database
      const { error } = await supabase
        .from('users')
        .update({
          user_tier: data.userTier,
          is_paid: data.userTier === 'paid'
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          ...(user.user_metadata as Record<string, any>),
          user_tier: data.userTier 
        }
      });
      
      if (metadataError) {
        throw metadataError;
      }
      
      toast({
        title: "Subscription updated",
        description: `You are now a ${data.userTier} user.`
      });
    } catch (err) {
      console.error('Error updating subscription:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update subscription',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium">Subscription Settings</h3>
        <p className="text-sm text-muted-foreground">
          Select your user tier to manage API usage.
        </p>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="userTier"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>User Tier</FormLabel>
                <FormControl>
                  <div className="flex flex-col space-y-4">
                    <div className="border rounded-md p-4 hover:border-primary cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="free"
                          name="userTier"
                          value="free"
                          checked={field.value === 'free'}
                          onChange={() => field.onChange('free')}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="free" className="font-medium text-sm flex flex-col">
                          <span>Free User</span>
                          <span className="text-xs text-muted-foreground">
                            Requests are batched for processing. Uses OpenAI's o3-mini High model.
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="border rounded-md p-4 hover:border-primary cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="paid"
                          name="userTier"
                          value="paid"
                          checked={field.value === 'paid'}
                          onChange={() => field.onChange('paid')}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="paid" className="font-medium text-sm flex flex-col">
                          <span>Paid User</span>
                          <span className="text-xs text-muted-foreground">
                            Requests processed in real-time. Uses OpenAI's latest models.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Free users will have their requests processed in batches, while paid users have real-time processing.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit">Update Subscription</Button>
        </form>
      </Form>
    </div>
  );
};

// Danger Zone Section
const DangerZoneSection: React.FC<{ user: User }> = ({ user }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete user from the database
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (dbError) {
        throw dbError;
      }
      
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      
      if (authError) {
        throw authError;
      }
      
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully."
      });
      
      // Redirect to sign in after a brief delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete account',
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteAllAudits = async () => {
    if (!window.confirm('Are you sure you want to delete all your audit history? This action cannot be undone and will remove all your audit results.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await auditService.deleteAllAudits();
      
      toast({
        title: "Audit history deleted",
        description: "All your audit history has been deleted successfully."
      });
      
      setIsDeleting(false);
    } catch (err) {
      console.error('Error deleting audit history:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete audit history',
        variant: "destructive"
      });
      
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all of your content.
        </p>
      </div>
      <Separator />
      
      {/* Delete All Audits Section */}
      <div className="rounded-lg border border-destructive p-4 bg-destructive/5">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Delete All Audit History</h4>
            <p className="text-sm text-muted-foreground">
              Once you delete your audit history, there is no going back. All your audit results will be permanently removed.
            </p>
          </div>
                
          <Button
            variant="destructive"
            onClick={handleDeleteAllAudits}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete All Audits"}
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Delete Account Section */}
      <div className="rounded-lg border border-destructive p-4 bg-destructive/5">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. All information associated with your account will be deleted permanently.
            </p>
          </div>
                
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
