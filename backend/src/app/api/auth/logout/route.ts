import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError } from '@/utils/error';

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json(
        { error: error.message, status: 500 },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
} 