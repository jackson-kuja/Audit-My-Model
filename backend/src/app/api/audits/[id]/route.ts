import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import type { Audit, UpdateAuditRequest } from '@/types';

// Get a specific audit
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    const supabase = createSupabaseClient();
    
    // Get the audit
    const { data: audit, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw new ApiError(error.message, 404);
    }
    
    return NextResponse.json(audit as Audit);
  } catch (error) {
    return handleError(error);
  }
}

// Update a specific audit
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Get the request body
    const updateData = await request.json() as UpdateAuditRequest;
    
    const supabase = createSupabaseClient();
    
    // Verify the audit exists and belongs to the user
    const { data: existingAudit, error: fetchError } = await supabase
      .from('audits')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !existingAudit) {
      throw new ApiError('Audit not found or access denied', 404);
    }
    
    // Update the audit
    const { data: audit, error } = await supabase
      .from('audits')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

// Delete a specific audit
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    const supabase = createSupabaseClient();
    
    // Verify the audit exists and belongs to the user
    const { data: existingAudit, error: fetchError } = await supabase
      .from('audits')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !existingAudit) {
      throw new ApiError('Audit not found or access denied', 404);
    }
    
    // Delete the audit
    const { error } = await supabase
      .from('audits')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new ApiError(error.message, 400);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
} 