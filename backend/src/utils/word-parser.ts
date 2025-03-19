import mammoth from 'mammoth';

export interface ParsedWord {
  fileName: string;
  fileSize: number;
  content: string;
  metadata: {
    title?: string;
    author?: string;
    created?: string;
    lastModified?: string;
  };
  statistics: {
    characterCount: number;
    wordCount: number;
    paragraphCount: number;
    headingCount: number;
    tableCount: number;
    imageCount: number;
    complexityScore: number; // 0-100 score based on various metrics
  };
}

/**
 * Parse a Word document and extract meaningful content for LLM analysis
 * @param buffer Buffer containing the Word file data
 * @param fileName Original filename
 * @returns Structured representation of the Word content
 */
export async function parseWordFile(buffer: Buffer, fileName: string): Promise<ParsedWord> {
  console.log(`[word-parser] Starting to parse Word file: ${fileName}, size: ${buffer.length} bytes`);
  
  try {
    // Extract text content using mammoth
    console.log(`[word-parser] Extracting text content...`);
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value;
    const warnings = result.messages;
    
    if (warnings.length > 0) {
      console.log(`[word-parser] Extraction warnings:`, warnings);
    }
    
    console.log(`[word-parser] Content extracted, length: ${content.length} characters`);
    
    // Extract document metadata if possible
    // Note: Basic metadata extraction in this implementation
    // A more comprehensive implementation would use docx/office-document-properties
    const metadata = {
      title: fileName.split('.')[0],
    };
    
    // Count document statistics
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.trim().length > 0);
    
    // Estimate heading count by looking for short paragraphs ending with no punctuation
    // This is a simple heuristic and not perfect
    const headingCount = paragraphs.filter(p => 
      p.length < 100 && 
      !p.trim().match(/[.,:;?!"]$/) && 
      p.trim().length > 0
    ).length;
    
    // Estimate table count (simple heuristic based on line patterns)
    // For a proper implementation, you would need to access the document's XML structure
    const tableCount = content.split(/[|+][-+]+[|+]/).length - 1;
    
    // Image count would require deeper parsing of the docx format
    const imageCount = 0;
    
    // Calculate complexity score
    const wordCountScore = Math.min(words.length / 100, 40);
    const headingRatioScore = Math.min((headingCount / Math.max(paragraphs.length, 1)) * 100, 30);
    const tableScore = Math.min(tableCount * 10, 30);
    
    const complexityScore = Math.min(
      wordCountScore + headingRatioScore + tableScore,
      100
    );
    
    const parsedDocument: ParsedWord = {
      fileName,
      fileSize: buffer.length,
      content,
      metadata,
      statistics: {
        characterCount: content.length,
        wordCount: words.length,
        paragraphCount: paragraphs.length,
        headingCount,
        tableCount,
        imageCount,
        complexityScore
      }
    };
    
    console.log(`[word-parser] Word file parsing completed successfully`);
    console.log(`[word-parser] Summary: ${words.length} words, ${paragraphs.length} paragraphs, complexity score: ${parsedDocument.statistics.complexityScore}`);
    
    return parsedDocument;
  } catch (error) {
    console.error(`[word-parser] ❌ Error parsing Word file:`, error);
    
    // Return a minimal result to avoid breaking the pipeline
    return {
      fileName,
      fileSize: buffer.length,
      content: "Error parsing document content",
      metadata: {},
      statistics: {
        characterCount: 0,
        wordCount: 0,
        paragraphCount: 0,
        headingCount: 0,
        tableCount: 0,
        imageCount: 0,
        complexityScore: 0
      }
    };
  }
}

/**
 * Convert the parsed Word data to a structured text representation for LLM analysis
 * @param parsedWord The parsed Word data
 * @returns A string representation of the Word content suitable for LLM context
 */
export function wordToText(parsedWord: ParsedWord): string {
  const lines: string[] = [];
  
  // File overview
  lines.push(`WORD DOCUMENT ANALYSIS`);
  lines.push(`======================`);
  lines.push(`Filename: ${parsedWord.fileName}`);
  lines.push(`File size: ${(parsedWord.fileSize / 1024).toFixed(2)} KB`);
  lines.push(`Complexity score: ${parsedWord.statistics.complexityScore}/100`);
  lines.push(`Word count: ${parsedWord.statistics.wordCount}`);
  lines.push(`Paragraph count: ${parsedWord.statistics.paragraphCount}`);
  lines.push(`Estimated headings: ${parsedWord.statistics.headingCount}`);
  lines.push(`Estimated tables: ${parsedWord.statistics.tableCount}`);
  lines.push(``);
  
  // Document metadata
  if (Object.keys(parsedWord.metadata).length > 0) {
    lines.push(`DOCUMENT METADATA`);
    lines.push(`=================`);
    for (const [key, value] of Object.entries(parsedWord.metadata)) {
      if (value) {
        lines.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
      }
    }
    lines.push(``);
  }
  
  // Sample content (limited to prevent token overuse)
  lines.push(`DOCUMENT CONTENT SAMPLE`);
  lines.push(`======================`);
  
  // Get a sample of the content (first 1000 characters)
  const contentSample = parsedWord.content.substring(0, 1000);
  lines.push(contentSample);
  
  if (parsedWord.content.length > 1000) {
    lines.push(`\n[Content truncated for brevity - total length: ${parsedWord.content.length} characters]`);
  }
  
  return lines.join('\n');
} 