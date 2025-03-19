import OpenAI from 'openai';
import { parseExcelFile, excelToText, ParsedExcel } from '../utils/excel-parser';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced logging function
function logWithTimestamp(message: string) {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  console.log(`[${timestamp}] 🔍 LLM API - ${message}`);
}

interface LLMAPIOptions {
  model: string;
  useTools: boolean;
  fileBase64: string;
  fileName: string;
  fileBuffer: Buffer;
}

interface LLMAnalysisResult {
  summary: string;
  findings: Array<{
    type: string;
    severity: string;
    location: string;
    description: string;
  }>;
  score: number;
  model_used: string;
  completion_time: string;
}

/**
 * Calls the OpenAI API to analyze the Excel file
 * @param options The options for the LLM API call
 * @returns The analysis result
 */
export async function callLLMAPI(options: LLMAPIOptions): Promise<LLMAnalysisResult> {
  logWithTimestamp(`Starting analysis with model ${options.model}`);
  logWithTimestamp(`File: ${options.fileName}, size: ${options.fileBuffer.length} bytes`);
  
  try {
    // Parse the Excel file
    logWithTimestamp('Parsing Excel file...');
    const startParseTime = Date.now();
    const parsedExcel = parseExcelFile(options.fileBuffer, options.fileName);
    const endParseTime = Date.now();
    logWithTimestamp(`Excel file parsed in ${endParseTime - startParseTime}ms`);
    logWithTimestamp(`Parsed data: ${parsedExcel.sheetsCount} sheets, ${parsedExcel.summary.formulaCount} formulas`);
    
    // Convert parsed Excel to text representation for LLM context
    logWithTimestamp('Converting Excel data to text for LLM...');
    const excelText = excelToText(parsedExcel);
    logWithTimestamp(`Excel data converted to text format (${excelText.length} chars)`);
    
    // Create prompt for LLM
    logWithTimestamp('Creating LLM prompt...');
    const prompt = createExcelAuditPrompt(excelText, parsedExcel);
    logWithTimestamp(`Prompt created (${prompt.length} chars)`);
    
    // Call OpenAI API
    logWithTimestamp(`Sending request to OpenAI API (model: ${options.model})...`);
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: options.model || "o3-mini",
      messages: [
        {
          role: "system",
          content: "You are an Excel auditing assistant that analyzes spreadsheets for errors, potential issues, and improvements. Provide detailed analysis with specific cell references."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 3000,
      response_format: { type: "json_object" }
    });
    
    const endTime = Date.now();
    logWithTimestamp(`OpenAI API response received in ${endTime - startTime}ms`);
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      logWithTimestamp('Error: Empty response from LLM');
      throw new Error("Empty response from LLM");
    }
    
    logWithTimestamp(`Response content length: ${content.length} chars`);
    
    try {
      logWithTimestamp('Parsing JSON response...');
      const parsedResponse = JSON.parse(content);
      logWithTimestamp('JSON parsed successfully');
      
      // Structure the result
      const result: LLMAnalysisResult = {
        summary: parsedResponse.summary || "Analysis completed successfully.",
        findings: parsedResponse.findings || [],
        score: calculateRiskScore(parsedResponse),
        model_used: options.model,
        completion_time: new Date().toISOString()
      };
      
      logWithTimestamp(`Analysis complete: ${result.findings.length} findings, score ${result.score}`);
      if (result.findings.length > 0) {
        logWithTimestamp(`Sample finding: ${result.findings[0].type} (${result.findings[0].severity}) at ${result.findings[0].location}`);
      }
      
      return result;
    } catch (parseError) {
      logWithTimestamp(`Error parsing LLM response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      
      // Return a fallback structured response
      logWithTimestamp('Using fallback response format');
      return createFallbackResponse(content, options.model);
    }
  } catch (error) {
    logWithTimestamp(`Error in LLM API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Creates a prompt for Excel auditing
 */
function createExcelAuditPrompt(excelText: string, parsedExcel: ParsedExcel): string {
  return `
Please analyze this Excel file and identify any issues, errors, or areas for improvement. 
Focus on formula correctness, data validation, structural issues, and best practices.

EXCEL FILE DETAILS:
${excelText}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Overall assessment of the spreadsheet",
  "findings": [
    {
      "type": "error|warning|info",
      "severity": "high|medium|low",
      "location": "specific cell or range reference",
      "description": "detailed description of the issue"
    }
  ],
  "recommendations": [
    "actionable recommendation to improve the spreadsheet"
  ]
}
`;
}

/**
 * Calculates a risk score based on the LLM response
 */
function calculateRiskScore(parsedResponse: any): number {
  let score = 50; // Start with a neutral score
  
  // If there are findings, adjust score based on severity
  if (parsedResponse.findings && Array.isArray(parsedResponse.findings)) {
    const findingScores = {
      high: 10,
      medium: 5,
      low: 2
    };
    
    parsedResponse.findings.forEach((finding: any) => {
      if (finding.severity && findingScores[finding.severity as keyof typeof findingScores]) {
        if (finding.type === 'error') {
          score += findingScores[finding.severity as keyof typeof findingScores] * 1.5;
        } else if (finding.type === 'warning') {
          score += findingScores[finding.severity as keyof typeof findingScores];
        } else {
          score += findingScores[finding.severity as keyof typeof findingScores] * 0.5;
        }
      }
    });
  }
  
  // Cap the score at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Creates a fallback response when parsing fails
 */
function createFallbackResponse(content: string, model: string): LLMAnalysisResult {
  return {
    summary: "The analysis was completed but could not be fully structured. The raw analysis is included in the first finding.",
    findings: [
      {
        type: "info",
        severity: "medium",
        location: "general",
        description: content.slice(0, 1000) + (content.length > 1000 ? "..." : "")
      }
    ],
    score: 50,
    model_used: model,
    completion_time: new Date().toISOString()
  };
} 