import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Latest API version
});

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
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
      );
    }

    // Cancel the subscription at the end of the current period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }
      })
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'An error occurred' },
        { status: 500 }
      )
    );
  }
} 