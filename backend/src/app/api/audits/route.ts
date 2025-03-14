import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import type { Audit, CreateAuditRequest } from '@/types';

// List all audits for the current user
export async function GET(request: Request) {
  try {
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    const supabase = createSupabaseClient();
    
    // Get all audits for the user
    const { data: audits, error } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new ApiError(error.message, 400);
    }
    
    return NextResponse.json(audits as Audit[]);
  } catch (error) {
    return handleError(error);
  }
}

// Create a new audit
export async function POST(request: Request) {
  try {
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Get the request body
    const { model_name, model_type, description } = await request.json() as CreateAuditRequest;
    
    if (!model_name) {
      throw new ApiError('Model name is required', 400);
    }
    
    const supabase = createSupabaseClient();
    
    // Create a new audit
    const { data: audit, error } = await supabase
      .from('audits')
      .insert([
        {
          user_id: userId,
          model_name,
          model_type,
          description,
          status: 'pending',
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 400);
    }
    
    return NextResponse.json(audit as Audit);
  } catch (error) {
    return handleError(error);
  }
} 