import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError } from '@/utils/error';
import type { AuthResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', status: 400 },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseClient();
    
    // Sign in the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message, status: 401 },
        { status: 401 }
      );
    }
    
    // Return success response
    const response: AuthResponse = {
      user: authData.user,
      session: authData.session,
      error: null,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
} 