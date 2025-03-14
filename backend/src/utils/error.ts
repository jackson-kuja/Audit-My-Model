import { NextResponse } from 'next/server';
import type { ErrorResponse } from '@/types';

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function handleError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, status: error.status },
      { 
        status: error.status,
        headers: corsHeaders
      }
    );
  }
  
  // Handle Supabase errors
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: string }).message;
    return NextResponse.json(
      { error: message, status: 500 },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
  
  return NextResponse.json(
    { error: 'An unexpected error occurred', status: 500 },
    { 
      status: 500,
      headers: corsHeaders
    }
  );
} 