import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Latest API version
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }

    const customerId = userData?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json({
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
      return NextResponse.json({
        subscribed: false,
        status: 'inactive',
        subscription: null
      });
    }

    // Return subscription details
    return NextResponse.json({
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
} 