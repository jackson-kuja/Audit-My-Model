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
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

export async function POST(req: NextRequest) {
  try {
    // Get request body
    const { userId, email, priceId, couponId } = await req.json();

    if (!userId || !email) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
      );
    }

    // Use provided price ID or fallback to environment variable
    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID;
    // Use provided coupon ID or fallback to environment variable
    const finalCouponId = couponId || process.env.STRIPE_COUPON_ID;

    if (!finalPriceId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'No price ID provided or configured' }, { status: 400 })
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError);
      return addCorsHeaders(
        NextResponse.json({ error: 'Error fetching user data' }, { status: 500 })
      );
    }

    let customerId: string;

    // If user doesn't have a Stripe customer ID, create one
    if (!userData?.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;

      // Save the customer ID to the user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return addCorsHeaders(
          NextResponse.json({ error: 'Error updating user profile' }, { status: 500 })
        );
      }
    } else {
      customerId = userData.stripe_customer_id;
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
      success_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/profile?canceled=true`,
    });

    return addCorsHeaders(
      NextResponse.json({ sessionId: session.id })
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'An error occurred' },
        { status: 500 }
      )
    );
  }
} 