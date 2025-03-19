import { createSupabaseClientWithToken, createSupabaseAdminClient } from '@/lib/supabase';
import { ApiError } from '@/utils/error';
import { callPowerPointLLMAPI } from '@/lib/llm-api';

// Bucket name for storing model files
const BUCKET_NAME = 'model-files';

// Enhanced logging function
function logWithTimestamp(message: string) {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  console.log(`[${timestamp}] 🔄 BACKEND POWERPOINT HANDLER - ${message}`);
}

export interface PowerPointAnalysisParams {
  file_path: string;
  model: string;
  use_tools: boolean;
  auth_token: string;
  user_id: string;
}

export async function handlePowerPointAnalysis(params: PowerPointAnalysisParams) {
  const { file_path, model = 'o3-mini', use_tools = true, auth_token, user_id } = params;
  
  logWithTimestamp(`Starting direct analysis: file=${file_path}, model=${model}, userId=${user_id}`);
  
  try {
    // Get the admin client for db/storage operations
    logWithTimestamp('Getting admin client for database/storage operations');
    const adminClient = createSupabaseAdminClient();
    
    // Get the file from storage
    logWithTimestamp(`Downloading file from '${BUCKET_NAME}/${file_path}'`);
    const { data: fileData, error: fileError } = await adminClient.storage
      .from(BUCKET_NAME)
      .download(file_path);
    
    if (fileError) {
      logWithTimestamp(`Error downloading file: ${fileError.message}`);
      throw new ApiError(`Error downloading file: ${fileError.message}`, 400);
    }
    
    logWithTimestamp('File downloaded successfully');
    
    // Convert file to base64 - Using Node's Buffer instead of browser's FileReader
    let base64: string;
    let buffer: Buffer;
    try {
      logWithTimestamp('Converting file data to buffer');
      // Convert the file data to an ArrayBuffer
      const arrayBuffer = await fileData.arrayBuffer();
      // Convert ArrayBuffer to Buffer
      buffer = Buffer.from(arrayBuffer);
      // Convert Buffer to base64
      base64 = buffer.toString('base64');
      logWithTimestamp(`File converted to base64 successfully, length: ${base64.length} chars`);
    } catch (conversionError) {
      logWithTimestamp(`Error converting file: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      throw new ApiError(`Error processing file: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`, 500);
    }
    
    // Call LLM API for analysis
    let analysis;
    try {
      logWithTimestamp(`Calling LLM API for analysis with model: ${model}`);
      
      // Use real implementation - no mock data
      analysis = await callPowerPointLLMAPI({
        model,
        useTools: use_tools,
        fileBase64: base64,
        fileName: file_path.split('/').pop() || '',
        fileBuffer: buffer,
      });
      
      logWithTimestamp('LLM analysis completed successfully');
      logWithTimestamp(`Analysis result: ${analysis.findings.length} findings, score: ${analysis.score}`);
    } catch (analysisError) {
      logWithTimestamp(`LLM analysis error: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
      
      // Update the audit record to indicate analysis failure
      const auditId = file_path.split('/')[0];
      logWithTimestamp(`Updating audit ${auditId} to failed status due to error`);
      
      await adminClient
        .from('audits')
        .update({
          status: 'failed',
          error_message: `Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auditId)
        .eq('user_id', user_id);
      
      throw new ApiError(`Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`, 500);
    }
    
    // Update the audit record with the analysis result
    const auditId = file_path.split('/')[0];
    logWithTimestamp(`Updating audit record with ID: ${auditId}`);
    
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
      .eq('user_id', user_id);
    
    if (updateError) {
      logWithTimestamp(`Error updating audit record: ${updateError.message}`);
      // Continue execution even if update fails
    } else {
      logWithTimestamp(`Successfully updated audit record ${auditId}`);
    }
    
    return {
      success: true,
      llm_analysis: analysis,
    };
  } catch (error) {
    logWithTimestamp(`Error in PowerPoint analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
} 