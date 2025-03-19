import { NextResponse } from 'next/server';
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  console.log('📤 [upload] Received upload request');
  
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log('📤 [upload] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('📤 [upload] Missing or invalid auth header');
      throw new ApiError('Unauthorized', 401);
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('📤 [upload] Empty token');
      throw new ApiError('Invalid authentication token', 401);
    }
    
    console.log('📤 [upload] Token present with length:', token.length);
    
    // Parse formData early to log any issues
    let formData;
    try {
      formData = await request.formData();
      console.log('📤 [upload] FormData keys:', Array.from(formData.keys()));
    } catch (formError) {
      console.error('📤 [upload] Error parsing form data:', formError);
      throw new ApiError('Invalid form data', 400);
    }
    
    // Verify the token and get user
    console.log('📤 [upload] Verifying token with Supabase');
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('📤 [upload] Auth error:', authError?.message);
      throw new ApiError('Authentication failed', 401);
    }
    
    console.log('📤 [upload] User authenticated:', user.id);
    
    // Get form data
    const file = formData.get('file') as File;
    const auditId = formData.get('auditId') as string;
    
    console.log('📤 [upload] File present:', !!file);
    console.log('📤 [upload] Audit ID:', auditId);
    
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
        status: 'in_progress',
        file_path: fileName,
      })
      .eq('id', auditId)
      .select()
      .single();
    
    if (updateError) {
      throw new ApiError(updateError.message, 400);
    }
    
    // Determine file type based on extension or mime type
    const fileType = getFileType(file);
    console.log(`📤 [upload] Detected file type: ${fileType}`);
    
    // Directly trigger analysis (synchronously)
    try {
      console.log(`📤 [upload] Directly calling ${fileType} analysis for file ${fileName}`);
      
      // Call the appropriate handler based on file type
      let analysisResult;
      
      if (fileType === 'excel') {
        const { handleExcelAnalysis } = await import('../excel/analyze/handler');
        analysisResult = await handleExcelAnalysis({
          file_path: fileName,
          model: 'o3-mini',
          use_tools: true,
          auth_token: authHeader?.replace('Bearer ', '') || '',
          user_id: audit.user_id
        });
      } else if (fileType === 'word') {
        const { handleWordAnalysis } = await import('../word/analyze/handler');
        analysisResult = await handleWordAnalysis({
          file_path: fileName,
          model: 'o3-mini',
          use_tools: true,
          auth_token: authHeader?.replace('Bearer ', '') || '',
          user_id: audit.user_id
        });
      } else if (fileType === 'powerpoint') {
        const { handlePowerPointAnalysis } = await import('../powerpoint/analyze/handler');
        analysisResult = await handlePowerPointAnalysis({
          file_path: fileName,
          model: 'o3-mini',
          use_tools: true,
          auth_token: authHeader?.replace('Bearer ', '') || '',
          user_id: audit.user_id
        });
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      console.log(`📤 [upload] Direct analysis call succeeded with result:`, JSON.stringify(analysisResult).substring(0, 200) + '...');
    } catch (analyzeError) {
      console.error(`📤 [upload] Error in direct analysis call:`, analyzeError);
      
      // Don't mark as failed here - let the analyze endpoint run asynchronously
      console.log("📤 [upload] Analysis will be retried asynchronously");
    }
    
    // Set CORS headers dynamically based on the origin
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
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
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Determine the type of file based on extension or mime type
 * @param file The file to check
 * @returns The file type ('excel', 'word', 'powerpoint', or 'unknown')
 */
function getFileType(file: File): 'excel' | 'word' | 'powerpoint' | 'unknown' {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  // Check for Excel files
  if (
    fileName.endsWith('.xlsx') || 
    fileName.endsWith('.xls') || 
    fileName.endsWith('.xlsm') ||
    mimeType.includes('spreadsheetml') ||
    mimeType.includes('excel') ||
    mimeType.includes('ms-excel')
  ) {
    return 'excel';
  }
  
  // Check for Word files
  if (
    fileName.endsWith('.docx') || 
    fileName.endsWith('.doc') || 
    fileName.endsWith('.docm') ||
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('msword') ||
    mimeType.includes('word')
  ) {
    return 'word';
  }
  
  // Check for PowerPoint files
  if (
    fileName.endsWith('.pptx') || 
    fileName.endsWith('.ppt') || 
    fileName.endsWith('.pptm') ||
    mimeType.includes('presentationml') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('ms-powerpoint')
  ) {
    return 'powerpoint';
  }
  
  // Default to unknown
  return 'unknown';
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 