import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://audit-my-file.onrender.com';

// Define the shape of the subscription data
interface SubscriptionData {
  subscribed: boolean;
  status: string;
  subscription: any | null;
}

// Define the context type
interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  isPro: boolean;
}

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscriptionData: null,
  isLoading: false,
  error: null,
  refreshSubscription: async () => {},
  isPro: false,
});

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);

  // Function to fetch subscription status
  const fetchSubscriptionStatus = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/subscription-status?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionData(data);
        setIsPro(data.subscribed && ['active', 'trialing'].includes(data.status));
      } else {
        setError(data.error || 'Failed to fetch subscription status');
        console.error('Error fetching subscription status:', data.error);
      }
    } catch (error) {
      setError('Failed to fetch subscription status');
      console.error('Error fetching subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh subscription data - can be called from components
  const refreshSubscription = async () => {
    await fetchSubscriptionStatus();
  };

  // Fetch subscription status when user changes
  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionStatus();
    } else {
      setSubscriptionData(null);
      setIsPro(false);
    }
  }, [user?.id]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscriptionData, 
        isLoading, 
        error, 
        refreshSubscription,
        isPro
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use the subscription context
export const useSubscription = () => useContext(SubscriptionContext); 