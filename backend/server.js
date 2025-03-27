const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Add error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// Enable CORS
app.use((req, res, next) => {
  // Allow all origins temporarily
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Special raw body handling for Stripe webhooks
app.use('/api/webhook', express.raw({type: 'application/json'}));

// Parse JSON request bodies for all other routes
app.use(express.json());

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase, supabaseAdmin;

// Create Supabase clients with proper error handling
try {
  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  
  // Create standard client
  supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
  console.log('Supabase client created');
  
  // Create admin client if service role key is available
  if (supabaseKey) {
    supabaseAdmin = createClient(supabaseUrl || '', supabaseKey);
    console.log('Supabase admin client created');
  } else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not provided, admin operations will not work');
    // Create a fallback that logs errors
    supabaseAdmin = {
      auth: {
        admin: {
          updateUserById: async () => {
            console.error('Cannot update user: SUPABASE_SERVICE_ROLE_KEY not provided');
            return { error: new Error('SUPABASE_SERVICE_ROLE_KEY not provided') };
          }
        }
      }
    };
  }
} catch (error) {
  console.error('Error initializing Supabase clients:', error);
  // Create fallback clients to prevent crashes
  supabase = { 
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: new Error('Supabase client failed to initialize') }) }) })
    })
  };
  supabaseAdmin = {
    auth: {
      admin: {
        updateUserById: async () => {
          return { error: new Error('Supabase admin client failed to initialize') };
        }
      }
    }
  };
}

// Basic health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Audit My File API is running' });
});

// Audits endpoint - GET all audits
app.get('/api/audits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// Audits endpoint - GET a single audit
app.get('/api/audits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Audit not found' });
    
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching audit ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Stripe: Subscription Status endpoint
app.get('/api/subscription-status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Use supabaseAdmin instead of supabase to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId);

    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    // If no profile exists, treat as unsubscribed
    if (!userData || userData.length === 0) {
      return res.status(200).json({
        subscribed: false,
        status: 'inactive',
        subscription: null
      });
    }

    const customerId = userData[0].stripe_customer_id;

    if (!customerId) {
      return res.status(200).json({
        subscribed: false,
        status: 'inactive',
        subscription: null
      });
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    // Check if customer has any active subscriptions
    const activeSubscription = subscriptions.data.find(sub => 
      ['active', 'trialing'].includes(sub.status)
    );

    if (!activeSubscription) {
      return res.status(200).json({
        subscribed: false,
        status: 'inactive',
        subscription: null
      });
    }

    // Return subscription details
    return res.status(200).json({
      subscribed: true,
      status: activeSubscription.status,
      subscription: {
        id: activeSubscription.id,
        current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: activeSubscription.cancel_at_period_end,
        plan: {
          id: activeSubscription.items.data[0]?.price.id,
          amount: activeSubscription.items.data[0]?.price.unit_amount,
          interval: activeSubscription.items.data[0]?.price.recurring?.interval
        }
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    });
  }
});

// Stripe: Create Checkout Session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Get request body
    const { userId, email, priceId, couponId } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Use provided price ID or fallback to environment variable
    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID;
    // Use provided coupon ID or fallback to environment variable
    const finalCouponId = couponId || process.env.STRIPE_COUPON_ID;

    if (!finalPriceId) {
      return res.status(400).json({ error: 'No price ID provided or configured' });
    }

    // Check if user already has a Stripe customer ID - use supabaseAdmin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId);

    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    let customerId;
    const userProfile = userData && userData.length > 0 ? userData[0] : null;

    // If user doesn't have a Stripe customer ID, create one
    if (!userProfile?.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;

      // Save the customer ID to the user profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return res.status(500).json({ error: 'Error updating user profile' });
      }
    } else {
      customerId = userProfile.stripe_customer_id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      discounts: finalCouponId ? [{ coupon: finalCouponId }] : [],
      success_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.auditmyfile.com'}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.auditmyfile.com'}/profile?canceled=true`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    });
  }
});

// Stripe: Cancel Subscription endpoint
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscription ID' });
    }

    // Cancel the subscription at the end of the current period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    });
  }
});

// Stripe: Webhook endpoint
app.post('/api/webhook', async (req, res) => {
  // For webhook, we get the raw body instead of parsed JSON
  const payload = req.body;
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the event
  try {
    switch (event.type) {
      // Handle successful payment for a subscription
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Update user's tier in the database
        if (session.customer && session.mode === 'subscription') {
          // Get user ID from the customer's metadata
          const customer = await stripe.customers.retrieve(session.customer);
          const userId = customer.metadata.userId;
          
          if (userId) {
            // Update user tier in the database
            const { error: userUpdateError } = await supabaseAdmin
              .from('profiles')
              .update({
                user_tier: 'paid',
                is_paid: true
              })
              .eq('id', userId);
            
            if (userUpdateError) {
              console.error('Error updating user tier:', userUpdateError);
            }
            
            // Update user metadata
            const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
              userId,
              {
                user_metadata: {
                  user_tier: 'paid'
                }
              }
            );
            
            if (metadataError) {
              console.error('Error updating user metadata:', metadataError);
            }
          }
        }
        break;
      }
      
      // Handle subscription status changes
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get customer to find user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.userId;
        
        if (userId) {
          // Determine user tier based on subscription status
          const userTier = 
            ['active', 'trialing'].includes(subscription.status) ? 'paid' : 'free';
          const isPaid = ['active', 'trialing'].includes(subscription.status);
          
          // Update user tier in the database
          const { error: userUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
              user_tier: userTier,
              is_paid: isPaid
            })
            .eq('id', userId);
          
          if (userUpdateError) {
            console.error('Error updating user tier:', userUpdateError);
          }
          
          // Update user metadata
          const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                user_tier: userTier
              }
            }
          );
          
          if (metadataError) {
            console.error('Error updating user metadata:', metadataError);
          }
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : 'An error occurred' 
    });
  }
});

// Simple OPTIONS handler for CORS preflight requests
app.options('/api/audits', (req, res) => {
  res.status(200).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`); 
});
