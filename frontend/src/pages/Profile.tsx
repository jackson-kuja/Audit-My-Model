import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import type { User } from '../types/index';
import { cn } from "../lib/utils";
import auditService from '../services/auditService';
import { toast } from "../hooks/use-toast";
import { usePageTitle } from '../hooks/usePageTitle';
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle, HelpCircle } from 'lucide-react';
import { Badge } from "../components/ui/badge";

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

// Define schema for subscription settings
const subscriptionFormSchema = z.object({
  userTier: z.enum(['free', 'paid']),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
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
    title: "Subscription",
    id: "subscription"
  }
];

// Support mailto link
const supportMailto = `mailto:hello@athenlabs.com?subject=${encodeURIComponent('Support Request for Audit My File')}&body=${encodeURIComponent('Hello,\n\nI need assistance with Audit My File.\n\nDetails:\n\n')}`;

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://audit-my-file.onrender.com';

const Profile: React.FC = () => {
  usePageTitle('Profile');
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
                className={`justify-start ${item.id === "danger" ? "text-red-500 hover:text-red-700 hover:bg-red-50" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.title}
              </Button>
            ))}
            <Separator className="my-2" />
            
            <Button
              variant="outline"
              className="justify-start"
              asChild
            >
              <a href={supportMailto} target="_blank" rel="noopener noreferrer">
                Support
              </a>
            </Button>
            
            <Separator className="my-2" />
            
            <Button
              variant="outline"
              className="justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              Logout
            </Button>
            
            <Separator className="my-2" />
            
            <Button
              variant="outline"
              className="justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setActiveTab("danger")}
            >
              Danger Zone
            </Button>
          </Box>
        </Grid>
        
        {/* Content Area */}
        <Grid item xs={12} md={9}>
          <div className="mt-0">
            {activeTab === "profile" && <ProfileSection user={user} />}
            {activeTab === "password" && <PasswordSection user={user} />}
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

  const [buttonState, setButtonState] = useState<'default' | 'success' | 'error'>('default');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Update user profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          preferred_email: data.preferredEmail
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Change button state to success
      setButtonState('success');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setButtonState('default');
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Change button state to error
      setButtonState('error');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setButtonState('default');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium">Profile Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your personal information and account settings below.
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
          
          <Button 
            type="submit" 
            className={
              buttonState === 'success' ? 'bg-green-500 hover:bg-green-600' : 
              buttonState === 'error' ? 'bg-red-500 hover:bg-red-600' : ''
            }
          >
            {buttonState === 'success' ? 'Saved!' : 
             buttonState === 'error' ? 'Error!' : 
             'Update profile'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

// Password Change Section
const PasswordSection: React.FC<{ user: User }> = ({ user }) => {
  const [buttonState, setButtonState] = useState<'default' | 'success' | 'error'>('default');
  
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
      // First, verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword
      });
      
      // If sign-in fails, the current password is incorrect
      if (signInError) {
        setButtonState('error');
        setTimeout(() => {
          setButtonState('default');
        }, 2000);
        return;
      }
      
      // If current password is correct, update to the new password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) {
        throw error;
      }
      
      // Clear password fields
      form.reset();
      
      // Change button state to success
      setButtonState('success');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setButtonState('default');
      }, 2000);
    } catch (err) {
      console.error('Error updating password:', err);
      
      // Change button state to error
      setButtonState('error');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setButtonState('default');
      }, 2000);
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
          
          <Button 
            type="submit"
            className={
              buttonState === 'success' ? 'bg-green-500 hover:bg-green-600' : 
              buttonState === 'error' ? 'bg-red-500 hover:bg-red-600' : ''
            }
          >
            {buttonState === 'success' ? 'Saved!' : 
             buttonState === 'error' ? 'Error!' : 
             'Update Password'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

// Subscription Section
const SubscriptionSection: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch subscription status on component mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/subscription-status?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setSubscriptionData(data);
        } else {
          console.error('Error fetching subscription status:', data.error);
          toast({
            title: "Error",
            description: data.error || 'Failed to fetch subscription status',
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        toast({
          title: "Error",
          description: 'Failed to fetch subscription status',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user.id]);

  // Handle checkout
  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      
      // Create checkout session
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          priceId: process.env.REACT_APP_STRIPE_PRICE_ID, // From environment variable
          couponId: process.env.REACT_APP_STRIPE_COUPON_ID, // From environment variable
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.sessionId) {
        // Load Stripe.js
        const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');
        
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        
        // Redirect to checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        
        if (error) {
          throw error;
        }
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to redirect to checkout',
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!subscriptionData?.subscription?.id) return;
    
    if (!window.confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return;
    }
    
    try {
      setCancelLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData.subscription.id,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Subscription Canceled",
          description: "Your subscription has been canceled and will end at the end of your billing period.",
        });
        
        // Update subscription data
        setSubscriptionData({
          ...subscriptionData,
          subscription: {
            ...subscriptionData.subscription,
            cancel_at_period_end: true,
          },
        });
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: "destructive"
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="mt-0">
        <h3 className="text-lg font-medium">Subscription Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and payment details.
        </p>
      </div>
      <Separator />
      
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Subscription Details */}
          {subscriptionData?.subscribed ? (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 border">
                <h4 className="font-medium">Current Plan: Premium</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm flex justify-between">
                    <span>Status:</span> 
                    <span className="font-medium">
                      {subscriptionData.subscription.cancel_at_period_end 
                        ? 'Active (Canceling)' 
                        : 'Active'}
                    </span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span>Billing period ends:</span>
                    <span className="font-medium">
                      {formatDate(subscriptionData.subscription.current_period_end)}
                    </span>
                  </p>
                  {subscriptionData.subscription.cancel_at_period_end && (
                    <p className="text-sm text-amber-600 mt-2">
                      Your subscription will end on {formatDate(subscriptionData.subscription.current_period_end)}
                    </p>
                  )}
                </div>
              </div>
              
              {!subscriptionData.subscription.cancel_at_period_end && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Processing..." : "Cancel Subscription"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-md p-6 border">
                <h4 className="font-medium text-lg">Get Pro</h4>
                <p className="text-muted-foreground mt-1 mb-4">
                  Unlock unlimited audits and premium features.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5 text-primary mr-1" />
                    <span className="text-xs">Unlimited audits</span>
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5 text-primary mr-1" />
                    <span className="text-xs">Real-time processing</span>
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5 text-primary mr-1" />
                    <span className="text-xs">Priority support</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Processing..." : "Get Pro Now"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Danger Zone Section
const DangerZoneSection: React.FC<{ user: User }> = ({ user }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  
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
        throw new Error(`Database error: ${dbError.message || 'Could not delete user data'}`);
      }
      
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message || 'Could not delete authentication account'}`);
      }
      
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully."
      });
      
      // Redirect to sign in after a brief delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: "Account deletion failed",
        description: err instanceof Error ? err.message : 'Failed to delete account. Please contact support.',
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
        title: "Audit deletion failed",
        description: err instanceof Error 
          ? `Failed to delete audits: ${err.message}` 
          : 'Failed to delete audit history. Please try again or contact support.',
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
