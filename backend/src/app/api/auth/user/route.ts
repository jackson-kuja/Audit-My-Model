import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError } from '@/utils/error';
import type { User } from '@/types';

export async function GET(request: Request) {
  try {
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', status: 401 },
        { status: 401 }
      );
    }
    
    const supabase = createSupabaseClient();
    
    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      return NextResponse.json(
        { error: profileError.message, status: 404 },
        { status: 404 }
      );
    }
    
    const user: User = {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_paid: profile.is_paid,
      subscription_end_date: profile.subscription_end_date,
    };
    
    return NextResponse.json(user);
  } catch (error) {
    return handleError(error);
  }
} 