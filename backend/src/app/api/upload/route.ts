import { NextResponse } from 'next/server';
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new ApiError('Authentication failed', 401);
    }
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const auditId = formData.get('auditId') as string;
    
    if (!file) {
      throw new ApiError('File is required', 400);
    }
    
    if (!auditId) {
      throw new ApiError('Audit ID is required', 400);
    }
    
    // Verify the audit exists and belongs to the user
    const adminClient = createSupabaseAdminClient();
    const { data: existingAudit, error: fetchError } = await adminClient
      .from('audits')
      .select('id')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !existingAudit) {
      throw new ApiError('Audit not found or access denied', 404);
    }
    
    // Generate a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${auditId}/${uuidv4()}.${fileExtension}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('model-files')
      .upload(fileName, file);
    
    if (uploadError) {
      throw new ApiError(uploadError.message, 400);
    }
    
    // Get the public URL
    const { data: urlData } = adminClient.storage
      .from('model-files')
      .getPublicUrl(fileName);
    
    // Update the audit record with file information
    const { data: audit, error: updateError } = await adminClient
      .from('audits')
      .update({
        original_filename: file.name,
        file_size_bytes: file.size,
        file_mime_type: file.type,
        upload_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', auditId)
      .select()
      .single();
    
    if (updateError) {
      throw new ApiError(updateError.message, 400);
    }
    
    return NextResponse.json({
      success: true,
      audit,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: fileName
      },
    }, {
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