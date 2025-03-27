import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from '../components/ui/use-toast';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://audit-my-file.onrender.com';

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initiateCheckout = async (userId: string, email: string) => {
    try {
      setIsLoading(true);
      
      // Create checkout session
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
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
      return false;
    } finally {
      setIsLoading(false);
    }
    
    return true;
  };

  return {
    initiateCheckout,
    isLoading
  };
}; 