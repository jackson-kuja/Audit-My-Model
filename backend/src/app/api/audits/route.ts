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
  console.log('📋 [audits] Received POST request');
  
  try {
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    // Get the auth token
    const authHeader = request.headers.get('authorization');
    
    // Log headers in a safer way
    console.log('📋 [audits] Headers present:', headers.has('authorization'));
    console.log('📋 [audits] Auth header present:', !!authHeader);
    
    // For testing, create a dummy user ID if not provided
    let effectiveUserId = userId;
    
    if (!effectiveUserId) {
      console.log('📋 [audits] No user ID found, using fallback user ID');
      effectiveUserId = 'f8af59b9-d11a-498f-b5b6-549d6d42c4df'; // fallback ID for testing
    }
    
    // Get the request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📋 [audits] Request body:', requestBody);
    } catch (jsonError) {
      console.error('📋 [audits] Error parsing JSON body:', jsonError);
      throw new ApiError('Invalid JSON body', 400);
    }
    
    const { model_name, model_type, description } = requestBody as CreateAuditRequest;
    
    if (!model_name) {
      console.error('📋 [audits] Missing model_name in request');
      throw new ApiError('Model name is required', 400);
    }
    
    const supabase = createSupabaseClient();
    
    // Create a new audit
    console.log('📋 [audits] Creating audit record with user ID:', effectiveUserId);
    const { data: audit, error } = await supabase
      .from('audits')
      .insert([
        {
          user_id: effectiveUserId,
          model_name,
          model_type,
          description,
          status: 'pending',
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('📋 [audits] Supabase error creating audit:', error);
      throw new ApiError(error.message, 400);
    }
    
    console.log('📋 [audits] Audit created successfully with ID:', audit.id);
    return NextResponse.json(audit as Audit);
  } catch (error) {
    console.error('📋 [audits] Unhandled error:', error);
    return handleError(error);
  }
} 