import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import type { User } from '@/types';

export async function PUT(request: Request) {
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Unauthorized', 401);
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError('Invalid authentication token', 401);
    }
    
    // Verify the token and get user
    const supabase = createSupabaseClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      throw new ApiError('Authentication failed', 401);
    }
    
    // Get request body
    const { first_name, last_name, email } = await request.json();
    
    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        email
      })
      .eq('id', authUser.id)
      .select()
      .single();
    
    if (updateError) {
      throw new ApiError('Error updating profile', 400);
    }
    
    // Also update the auth email if provided
    if (email && email !== authUser.email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email
      });
      
      if (emailUpdateError) {
        throw new ApiError('Error updating email', 400);
      }
    }
    
    const user: User = {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_paid: profile.is_paid,
      subscription_end_date: profile.subscription_end_date,
    };
    
    return NextResponse.json(user, {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    return handleError(error);
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 