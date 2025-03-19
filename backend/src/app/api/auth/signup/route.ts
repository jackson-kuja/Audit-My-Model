import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError } from '@/utils/error';
import type { AuthResponse, User } from '@/types';

export async function POST(request: Request) {
  try {
    const { email, password, first_name, last_name } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', status: 400 },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseClient();
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
      },
    });
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message, status: 400 },
        { status: 400 }
      );
    }
    
    // Return success response
    const response: AuthResponse = {
      user: authData.user ? {
        id: authData.user.id,
        email: authData.user.email || '',
        first_name: authData.user.user_metadata?.first_name,
        last_name: authData.user.user_metadata?.last_name,
        is_paid: authData.user.user_metadata?.is_paid || false
      } as User : null,
      session: authData.session,
      error: null,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
} 