import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Get the user ID from the headers (set by middleware)
    const headers = new Headers(request.headers);
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Get the audit ID from the request
    const formData = await request.formData();
    const auditId = formData.get('auditId');
    const file = formData.get('file') as File;
    
    if (!auditId || !file) {
      throw new ApiError('Audit ID and file are required', 400);
    }
    
    const supabase = createSupabaseClient();
    
    // Verify the audit exists and belongs to the user
    const { data: existingAudit, error: fetchError } = await supabase
      .from('audits')
      .select('id')
      .eq('id', auditId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !existingAudit) {
      throw new ApiError('Audit not found or access denied', 404);
    }
    
    // Generate a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${auditId}/${uuidv4()}.${fileExtension}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('model-files')
      .upload(fileName, file);
    
    if (uploadError) {
      throw new ApiError(uploadError.message, 400);
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('model-files')
      .getPublicUrl(fileName);
    
    // Update the audit record with file information
    const { data: audit, error: updateError } = await supabase
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
    
    // Directly trigger analysis (synchronously)
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1] || '';
      
      console.log(`Direct analysis: Auth header present:`, !!authHeader);
      console.log(`Direct analysis: Token extracted:`, !!token);
      
      if (!token) {
        console.error("No auth token found for analysis");
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/excel/analyze`;
      console.log(`Direct analysis: Calling API: ${apiUrl}`);
      console.log(`Direct analysis: Request body:`, { file_path: fileName, model: 'o3-mini', use_tools: true });
      
      const analyzeResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || ''
        },
        body: JSON.stringify({
          file_path: fileName,
          model: 'o3-mini',
          use_tools: true
        })
      });
      
      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error(`Direct analysis failed: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
        console.error(`Error details: ${errorText}`);
        
        // Update audit to failed status
        await supabase
          .from('audits')
          .update({
            status: 'failed',
            error_message: `Analysis failed: ${analyzeResponse.statusText} - ${errorText}`
          })
          .eq('id', auditId);
      } else {
        const result = await analyzeResponse.json();
        console.log(`Direct analysis succeeded with result:`, result);
      }
    } catch (analyzeError) {
      console.error(`Error during direct analysis:`, analyzeError);
      
      // Update audit to failed status
      await supabase
        .from('audits')
        .update({
          status: 'failed',
          error_message: `Analysis error: ${analyzeError instanceof Error ? analyzeError.message : String(analyzeError)}`
        })
        .eq('id', auditId);
    }
    
    return NextResponse.json({
      success: true,
      audit,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    return handleError(error);
  }
} 