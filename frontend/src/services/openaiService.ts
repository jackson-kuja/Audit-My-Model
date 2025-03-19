import { supabase } from '../utils/supabase';

interface OpenAIRequestOptions {
  model: string;
  messages: Array<{ role: string; content: string | Array<any> }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

// Simplified OpenAI service - all requests processed instantly
const openaiService = {
  // Process a request through OpenAI API
  async processRequest(options: OpenAIRequestOptions): Promise<OpenAIResponse> {
    // Check user authentication
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Process the request immediately for all users
    return this.sendDirectRequest(options);
  },
  
  // Send a direct request to OpenAI API
  async sendDirectRequest(options: OpenAIRequestOptions): Promise<OpenAIResponse> {
    // Always use o3-mini model for all users
    const modelToUse = "o3-mini";
    
    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        response_format: options.response_format
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
};

export default openaiService; 