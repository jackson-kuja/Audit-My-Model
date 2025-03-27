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
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['https://www.auditmyfile.com', 'http://localhost:3000', 'http://localhost:3001'];
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      // Optional: Allow any origin in development
      callback(null, true);
      // For production, you can restrict origins:
      // callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

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
    
    // Check if supabaseAdmin is properly initialized
    if (!supabaseAdmin || !supabaseAdmin.from) {
      console.error('Supabase admin client not initialized properly');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Return inactive status by default if we encounter database schema issues
    let subscriptionResponse = {
      subscribed: false,
      status: 'inactive',
      subscription: null
    };

    try {
      // Use supabaseAdmin instead of supabase to bypass RLS
      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*')  // Select all columns instead of just stripe_customer_id
        .eq('id', userId);

      if (userError) {
        console.error('Error fetching user data:', JSON.stringify(userError, null, 2));
        // Return inactive status instead of error if column doesn't exist
        if (userError.code === '42703' && userError.message.includes('stripe_customer_id does not exist')) {
          console.log('stripe_customer_id column not found, returning inactive status');
          return res.status(200).json(subscriptionResponse);
        }
        return res.status(500).json({ error: 'Error fetching user data' });
      }

      if (!userData || userData.length === 0) {
        return res.status(200).json(subscriptionResponse);
      }

      // Check if stripe_customer_id exists in the returned data
      const customerId = userData[0].stripe_customer_id;

      if (!customerId) {
        return res.status(200).json(subscriptionResponse);
      }

      // Get customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.default_payment_method']
      });

      const activeSubscription = subscriptions.data.find(sub => 
        ['active', 'trialing'].includes(sub.status)
      );

      if (!activeSubscription) {
        return res.status(200).json(subscriptionResponse);
      }

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
    } catch (innerError) {
      console.error('Error in subscription status lookup:', innerError);
      return res.status(200).json(subscriptionResponse);
    }
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

    // Check if supabaseAdmin is properly initialized
    if (!supabaseAdmin || !supabaseAdmin.from) {
      console.error('Supabase admin client not initialized properly');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create a Stripe customer ID if not exists or if schema issues
    let customerId;
    
    try {
      // Check if user already has a Stripe customer ID - use supabaseAdmin
      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*')  // Select all columns to check schema
        .eq('id', userId);

      if (userError) {
        console.error('Error fetching user data:', JSON.stringify(userError, null, 2));
        // If column doesn't exist, create a new customer
        if (userError.code === '42703' && userError.message.includes('stripe_customer_id does not exist')) {
          console.log('stripe_customer_id column not found, creating new customer');
          // Create a new customer if stripe_customer_id doesn't exist in schema
          const customer = await stripe.customers.create({
            email: email,
            metadata: { userId: userId }
          });
          customerId = customer.id;
          
          // We cannot update the profile since the column doesn't exist
          console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
        } else {
          // For other errors, return 500
          return res.status(500).json({ error: 'Error fetching user data' });
        }
      } else if (!userData || userData.length === 0) {
        // Create a new customer if user not found
        const customer = await stripe.customers.create({
          email: email,
          metadata: { userId: userId }
        });
        customerId = customer.id;
        
        // Create profile if it doesn't exist
        await supabaseAdmin
          .from('profiles')
          .insert([
            { 
              id: userId, 
              // Only try to set stripe_customer_id if the column exists
              ...(userData && userData[0] && 'stripe_customer_id' in userData[0] ? { stripe_customer_id: customerId } : {})
            }
          ]);
        
        console.log(`Created new profile and Stripe customer: ${customerId}`);
      } else {
        // Check if stripe_customer_id exists in the schema
        if (userData[0] && 'stripe_customer_id' in userData[0]) {
          customerId = userData[0].stripe_customer_id;
          
          // If no customer ID saved yet, create one
          if (!customerId) {
            const customer = await stripe.customers.create({
              email: email,
              metadata: { userId: userId }
            });
            customerId = customer.id;
            
            // Update the user's customer ID in Supabase
            await supabaseAdmin
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', userId);
            
            console.log(`Updated user ${userId} with new Stripe customer: ${customerId}`);
          }
        } else {
          // Create a new customer if stripe_customer_id isn't in the schema
          const customer = await stripe.customers.create({
            email: email,
            metadata: { userId: userId }
          });
          customerId = customer.id;
          console.log(`Created new Stripe customer (schema issue): ${customerId}`);
        }
      }
    } catch (customerError) {
      console.error('Error managing Stripe customer:', customerError);
      // Create a new customer as fallback
      try {
        const customer = await stripe.customers.create({
          email: email,
          metadata: { userId: userId }
        });
        customerId = customer.id;
        console.log(`Created fallback Stripe customer: ${customerId}`);
      } catch (fallbackError) {
        console.error('Error creating fallback customer:', fallbackError);
        return res.status(500).json({ error: 'Failed to create Stripe customer' });
      }
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
      success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/dashboard`,
      ...(finalCouponId 
        ? { discounts: [{ coupon: finalCouponId }] } 
        : { allow_promotion_codes: true })
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'An error occurred' });
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`); 
});
