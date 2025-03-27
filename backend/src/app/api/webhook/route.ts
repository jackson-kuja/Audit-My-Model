import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  const allowedOrigins = [
    'https://auditmyfile.com',
    'https://www.auditmyfile.com',
    'http://localhost:3000'
  ];
  
  const origin = allowedOrigins.includes(response.headers.get('origin') || '')
    ? response.headers.get('origin')
    : 'https://www.auditmyfile.com';
    
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

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
    return addCorsHeaders(
      NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      // Handle successful payment for a subscription
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update user's tier in the database
        if (session.customer && session.mode === 'subscription') {
          // Get user ID from the customer's metadata
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
          const userId = customer.metadata.userId;
          
          if (userId) {
            // Update user tier in the database
            const { error: userUpdateError } = await supabase
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
            const { error: metadataError } = await supabase.auth.admin.updateUserById(
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
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer to find user ID
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata.userId;
        
        if (userId) {
          // Determine user tier based on subscription status
          const userTier = 
            ['active', 'trialing'].includes(subscription.status) ? 'paid' : 'free';
          const isPaid = ['active', 'trialing'].includes(subscription.status);
          
          // Update user tier in the database
          const { error: userUpdateError } = await supabase
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
          const { error: metadataError } = await supabase.auth.admin.updateUserById(
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

    return addCorsHeaders(NextResponse.json({ received: true }));
  } catch (err) {
    console.error('Error processing webhook:', err);
    return addCorsHeaders(
      NextResponse.json(
        { error: err instanceof Error ? err.message : 'An error occurred' },
        { status: 500 }
      )
    );
  }
} 