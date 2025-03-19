import { NextResponse } from 'next/server';
import { createSupabaseClientWithToken } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';
import { handlePowerPointAnalysis } from './handler';

// Enhanced logging function
function logWithTimestamp(message: string) {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  console.log(`[${timestamp}] 🔄 BACKEND POWERPOINT API - ${message}`);
}

export async function POST(request: Request) {
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('authorization');
    logWithTimestamp(`Auth header received: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logWithTimestamp('Error: Invalid authorization header format');
      throw new ApiError('Missing or invalid authorization header format', 401);
    }
    
    const token = authHeader.split(' ')[1];
    logWithTimestamp(`Token extracted, length: ${token ? token.length : 0}`);
    
    if (!token) {
      logWithTimestamp('Error: Empty token');
      throw new ApiError('Empty token', 401);
    }
    
    // Get the request body
    const body = await request.json();
    const { file_path, model = 'o3-mini', use_tools = true } = body;
    
    logWithTimestamp(`Request params: file_path=${file_path}, model=${model}, use_tools=${use_tools}`);
    
    if (!file_path) {
      logWithTimestamp('Error: Missing file_path parameter');
      throw new ApiError('File path is required', 400);
    }
    
    try {
      // Create a Supabase client with the access token
      logWithTimestamp('Creating Supabase client with token');
      const supabase = createSupabaseClientWithToken(token);
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        logWithTimestamp(`Authentication error: ${error?.message || 'No user found'}`);
        throw new ApiError('Authentication failed', 401);
      }
      
      logWithTimestamp(`User authenticated: ${data.user.id}`);
      const user = data.user;
      
      // Call the handler function to analyze the PowerPoint file
      logWithTimestamp(`Calling handler function for analysis`);
      const analysisResult = await handlePowerPointAnalysis({
        file_path,
        model,
        use_tools,
        auth_token: token,
        user_id: user.id
      });
      
      // Set CORS headers dynamically based on the origin
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      logWithTimestamp(`Sending successful response to origin: ${origin}`);
      
      return NextResponse.json(analysisResult, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    } catch (authError) {
      logWithTimestamp(`Authentication error: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
      throw new ApiError(`Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`, 401);
    }
  } catch (error) {
    logWithTimestamp(`Request handling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return handleError(error);
  }
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