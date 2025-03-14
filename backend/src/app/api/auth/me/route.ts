import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import type { User } from '@/types';

export async function GET(request: Request) {
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
    
    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (profileError) {
      throw new ApiError('User profile not found', 404);
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