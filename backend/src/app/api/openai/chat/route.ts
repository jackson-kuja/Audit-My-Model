import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseClientWithToken } from '@/lib/supabase';
import { handleError, ApiError } from '@/utils/error';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('authorization');
    
    // Get the request body
    const body = await request.json();
    const { model = 'o3-mini', messages, temperature = 0.7, max_tokens = 1000, response_format } = body;
    
    console.log('[openai/chat] Request body:', { model, messages: messages.length, temperature, max_tokens });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ApiError('Messages are required and must be an array', 400);
    }
    
    // Authentication is optional for this endpoint since it's used directly by the frontend
    let userId = 'anonymous';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          // Create a Supabase client with the access token
          const supabase = createSupabaseClientWithToken(token);
          const { data, error } = await supabase.auth.getUser();
          
          if (!error && data.user) {
            console.log('[openai/chat] User authenticated:', data.user.id);
            userId = data.user.id;
          }
        } catch (authError) {
          console.warn('[openai/chat] Auth validation warning:', authError);
          // Continue with anonymous user
        }
      }
    }
    
    // Call OpenAI API
    try {
      console.log(`[openai/chat] Calling OpenAI API with model ${model}...`);
      
      const startTime = Date.now();
      
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        response_format
      });
      
      const endTime = Date.now();
      console.log(`[openai/chat] OpenAI response received in ${endTime - startTime}ms`);
      
      // Set CORS headers dynamically based on the origin
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    } catch (openaiError) {
      console.error('[openai/chat] OpenAI API error:', openaiError);
      throw new ApiError(`OpenAI API error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`, 500);
    }
  } catch (error) {
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