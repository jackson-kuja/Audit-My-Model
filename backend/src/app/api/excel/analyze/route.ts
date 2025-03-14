import { NextResponse } from 'next/server';
import { createSupabaseClientWithToken, createSupabaseAdminClient } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import { callLLMAPI } from '@/lib/llm-api';

// Bucket name for storing model files
const BUCKET_NAME = 'model-files';

// Mock analysis results for demonstration
const generateMockAnalysis = (model: string, useTools: boolean) => {
  return {
    summary: "This Excel file contains financial data with potential issues in formula consistency and data validation.",
    findings: [
      {
        type: "error",
        severity: "high",
        location: "Sheet1!B12:D25",
        description: "Inconsistent formulas detected in financial calculations"
      },
      {
        type: "warning",
        severity: "medium",
        location: "Sheet2!A5:A15",
        description: "Missing data validation on user input cells"
      },
      {
        type: "info",
        severity: "low",
        location: "Sheet3",
        description: "Sheet contains hidden rows which may obscure important data"
      }
    ],
    score: 73,
    model_used: model,
    tools_used: useTools,
    analysis_duration_seconds: Math.floor(Math.random() * 30) + 15,
    completion_time: new Date().toISOString()
  };
};

export async function POST(request: Request) {
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Missing or invalid authorization header format', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError('Empty token', 401);
    }
    
    // Get the request body
    const body = await request.json();
    const { file_path, model = 'o3-mini', use_tools = true } = body;
    
    if (!file_path) {
      throw new ApiError('File path is required', 400);
    }
    
    try {
      // Create a Supabase client with the access token
      const supabase = createSupabaseClientWithToken(token);
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        console.error('Token validation error:', error?.message);
        throw new ApiError('Authentication failed', 401);
      }
      
      console.log('User authenticated successfully:', data.user.id);
      const user = data.user;
      
      // Get the admin client for db/storage operations
      const adminClient = createSupabaseAdminClient();
      
      // Get the file from storage
      console.log(`Downloading file from '${BUCKET_NAME}/${file_path}'...`);
      const { data: fileData, error: fileError } = await adminClient.storage
        .from(BUCKET_NAME)
        .download(file_path);
      
      if (fileError) {
        throw new ApiError(`Error downloading file: ${fileError.message}`, 400);
      }
      
      // Convert file to base64 - Using Node's Buffer instead of browser's FileReader
      let base64: string;
      let buffer: Buffer;
      try {
        // Convert the file data to an ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer();
        // Convert ArrayBuffer to Buffer
        buffer = Buffer.from(arrayBuffer);
        // Convert Buffer to base64
        base64 = buffer.toString('base64');
        console.log('File converted to base64 successfully');
      } catch (conversionError) {
        console.error('Error converting file to base64:', conversionError);
        throw new ApiError(`Error processing file: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`, 500);
      }
      
      // Call LLM API for analysis
      const analysis = await callLLMAPI({
        model,
        useTools: use_tools,
        fileBase64: base64,
        fileName: file_path.split('/').pop(),
        fileBuffer: buffer,
      });
      
      // Update the audit record with the analysis result
      const auditId = file_path.split('/')[0];
      console.log(`Updating audit record with ID: ${auditId}`);
      
      const { error: updateError } = await adminClient
        .from('audits')
        .update({
          status: 'completed',
          results: {
            ...analysis,
            model,
            use_tools: use_tools,
            storage_path: file_path,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', auditId)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating audit record:', updateError.message);
        // Continue execution even if update fails
      } else {
        console.log(`Successfully updated audit record ${auditId}`);
      }
      
      return NextResponse.json({
        success: true,
        llm_analysis: analysis,
      }, {
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
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