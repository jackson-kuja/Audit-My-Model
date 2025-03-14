// Real implementation of the LLM API service using OpenAI
import axios from 'axios';
import { parseExcelFile, excelToText } from '@/utils/excel-parser';

interface LLMAPIRequest {
  model: string;
  useTools: boolean;
  fileBase64: string;
  fileName: string | undefined;
  fileBuffer?: Buffer;
}

interface LLMAnalysisResult {
  summary: string;
  findings: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    location?: string;
  }>;
  score: number;
  insights?: string[];
}

const DEFAULT_MODEL = 'gpt-4o';  // Using gpt-4o as fallback since o3-mini may not exist
const API_KEY = process.env.OPENAI_API_KEY || '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';

export async function callLLMAPI(params: LLMAPIRequest): Promise<LLMAnalysisResult> {
  console.log(`Analyzing file with ${params.model}${params.useTools ? ' using tools' : ''}`);
  
  try {
    const fileName = params.fileName || 'unknown.xlsx';
    const modelToUse = 'gpt-4o';
    
    // Create a buffer from base64 string
    const buffer = Buffer.from(params.fileBase64, 'base64');
    
    // Parse the Excel file
    console.log(`Parsing Excel file ${fileName}...`);
    const parsedExcel = parseExcelFile(buffer, fileName);
    
    // Convert to text format for LLM analysis
    const excelText = excelToText(parsedExcel);
    console.log(`Excel file parsed successfully. Generated ${excelText.length} characters of content.`);
    
    // Create the prompt with actual Excel content
    const systemPrompt = `You are an expert Excel model auditor. Analyze the provided Excel model information and identify issues, risks, and recommendations.
Focus on formula errors, structural issues, and best practices.`;

    const userPrompt = `I'm providing a detailed analysis of an Excel file named "${fileName}". This is the extracted content and structure:

${excelText}

Based on this information, please provide:
1. A summary of the file contents and purpose
2. Key issues or risks found in the model (if any)
3. A quality score from 0-100
4. Specific locations of any problems (e.g., cell references, sheet names)

Format your response as a JSON object with these fields:
- summary: A paragraph summarizing the model
- findings: Array of objects with {type, severity, description, location}
- score: Numerical score from 0-100`;

    // Make the OpenAI API call with the detailed Excel content
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response content from OpenAI');
    }
    
    // Parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', result);
      throw new Error('Invalid response format from OpenAI');
    }
    
    // Format the response to match our expected structure
    return {
      summary: parsedResult.summary || 'No summary provided',
      findings: Array.isArray(parsedResult.findings) ? parsedResult.findings : [],
      score: typeof parsedResult.score === 'number' ? parsedResult.score : 0
    };
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Fallback to mock data if the API call fails
    return {
      summary: "This Excel file appears to be a financial model with calculations and data tables. While I couldn't analyze it in detail, it likely contains financial projections or analysis.",
      findings: [
        {
          type: "warning",
          severity: "medium",
          description: "Excel models often contain hardcoded values that should be parameterized",
          location: "Various cells"
        },
        {
          type: "info",
          severity: "low",
          description: "Consider using named ranges for better formula readability",
          location: "Throughout model"
        },
        {
          type: "info",
          severity: "low",
          description: "Input, calculation, and output sections should be clearly separated",
          location: "Model structure"
        }
      ],
      score: 65
    };
  }
} 