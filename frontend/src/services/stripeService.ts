import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../utils/supabase';

// Initialize Stripe with your publishable key
// Try different environment variable formats (React uses REACT_APP_ prefix)
const stripePublishableKey = 
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_live_51Q5AMXAIZA5z1cEB7EB44emtUZZgMton2y5OzZuNkzrsAEa0SRpAZrhW62sepZQ58wnPGTL8BTVXxEqHZBjj1Hde00KngNmqwN'; // Fallback to the known key

// Log the key (first 8 chars only for security) for debugging
console.log('Stripe publishable key:', stripePublishableKey ? `${stripePublishableKey.substring(0, 8)}...` : 'not set');

const stripePromise = loadStripe(stripePublishableKey);

// Product and price IDs from Stripe via environment variables
const PRODUCT_ID = 
  process.env.REACT_APP_STRIPE_PRODUCT_ID || 
  process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID || 
  'prod_S18FTeYLEImBN0';

const PRICE_ID = 
  process.env.REACT_APP_STRIPE_PRICE_ID || 
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 
  'price_1R75zAAIZA5z1cEBvzTjyxqA';

const COUPON_ID = 
  process.env.REACT_APP_STRIPE_COUPON_ID || 
  process.env.NEXT_PUBLIC_STRIPE_COUPON_ID || 
  'BhoSIPes';

// Backend API URL
const BACKEND_URL = 
  process.env.REACT_APP_API_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://audit-my-file.onrender.com';

const stripeService = {
  // Create a checkout session for subscription
  createCheckoutSession: async (userId: string, email: string) => {
    try {
      // Make a request to your backend to create a checkout session
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          priceId: PRICE_ID,
          couponId: COUPON_ID, // Apply the coupon automatically
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Redirect to Stripe checkout
  redirectToCheckout: async (userId: string, email: string) => {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Create a checkout session
      const { sessionId } = await stripeService.createCheckoutSession(userId, email);

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  },

  // Get current subscription status
  getSubscriptionStatus: async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subscription-status?userId=${userId}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  },

  // Cancel a subscription
  cancelSubscription: async (subscriptionId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },
};

export default stripeService; 