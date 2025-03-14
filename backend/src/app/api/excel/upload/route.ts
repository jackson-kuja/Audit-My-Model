import { NextResponse } from 'next/server';
import { createSupabaseClient, createSupabaseAdminClient, createSupabaseClientWithToken } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import { v4 as uuidv4 } from 'uuid';

// Bucket name for storing model files
const BUCKET_NAME = 'model-files';

export async function POST(request: Request) {
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Missing or invalid authorization header format', 401);
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token extracted, length:', token ? token.length : 0);
    
    if (!token) {
      throw new ApiError('Empty token', 401);
    }
    
    // Verify the token and get user
    console.log('Attempting to validate token with Supabase...');
    
    try {
      // Create a Supabase client with the access token
      const supabase = createSupabaseClientWithToken(token);
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Token validation error:', error.message);
        throw new ApiError(`Token validation failed: ${error.message}`, 401);
      }
      
      if (!data.user) {
        console.error('No user found for token');
        throw new ApiError('Invalid user token', 401);
      }
      
      console.log('User authenticated successfully:', data.user.id);
      const user = data.user;
      
      // Parse the form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const model = formData.get('model') as string || 'o3-mini';
      const useTools = formData.get('use_tools') === 'true';
      
      console.log('Form data received:', { 
        filePresent: file ? true : false, 
        fileName: file?.name, 
        model, 
        useTools 
      });
      
      if (!file) {
        throw new ApiError('File is required', 400);
      }
      
      // Create a new audit record
      const adminClient = createSupabaseAdminClient();
      
      // Create new audit entry
      const { data: audit, error: auditError } = await adminClient
        .from('audits')
        .insert([
          {
            user_id: user.id,
            model_name: model,
            model_type: 'excel',
            description: `Excel analysis with ${model}${useTools ? ' using tools' : ''}`,
            status: 'pending',
            original_filename: file.name,
            file_size_bytes: file.size,
            file_mime_type: file.type,
            upload_timestamp: new Date().toISOString(),
          }
        ])
        .select()
        .single();
      
      if (auditError) {
        console.error('Error creating audit:', auditError.message);
        throw new ApiError(`Error creating audit: ${auditError.message}`, 400);
      }
      
      console.log('Audit created successfully:', audit.id);
      
      // Check if the bucket exists and create it if it doesn't
      try {
        // Try to get bucket info first
        const { data: bucketData, error: bucketError } = await adminClient.storage.getBucket(BUCKET_NAME);
        
        if (bucketError) {
          console.log(`Bucket '${BUCKET_NAME}' not found, attempting to create it...`);
          
          // Create the bucket
          const { data: newBucket, error: createError } = await adminClient.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError.message);
            throw new ApiError(`Error creating storage bucket: ${createError.message}`, 500);
          }
          
          console.log(`Bucket '${BUCKET_NAME}' created successfully`);
        } else {
          console.log(`Bucket '${BUCKET_NAME}' already exists`);
        }
      } catch (bucketSetupError) {
        console.error('Bucket setup error:', bucketSetupError);
        throw new ApiError(`Error setting up storage bucket: ${bucketSetupError instanceof Error ? bucketSetupError.message : 'Unknown error'}`, 500);
      }
      
      // Generate a unique file name
      const fileExtension = file.name.split('.').pop();
      const fileName = `${audit.id}/${uuidv4()}.${fileExtension}`;
      
      // Upload the file to Supabase Storage
      console.log(`Uploading file to '${BUCKET_NAME}/${fileName}'...`);
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError.message);
        throw new ApiError(`Error uploading file: ${uploadError.message}`, 400);
      }
      
      console.log('File uploaded successfully');
      
      // Get the public URL
      const { data: urlData } = adminClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      
      // Update the audit with file path
      const { data: updatedAudit, error: updateError } = await adminClient
        .from('audits')
        .update({
          results: {
            file_path: fileName,
            public_url: urlData.publicUrl,
            model,
            use_tools: useTools,
          }
        })
        .eq('id', audit.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating audit:', updateError.message);
        throw new ApiError(`Error updating audit: ${updateError.message}`, 400);
      }
      
      console.log('Audit updated successfully');
      
      return NextResponse.json(
        { success: true, file_path: fileName, audit: updatedAudit },
        {
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    } catch (authError) {
      console.error('Auth error:', authError);
      throw new ApiError(`Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`, 401);
    }
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