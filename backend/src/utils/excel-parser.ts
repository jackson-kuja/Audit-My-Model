import * as XLSX from 'xlsx';

interface ParsedCell {
  address: string;
  value: any;
  formula?: string;
  type?: string;
  format?: string;
}

interface ParsedSheet {
  name: string;
  rows: number;
  columns: number;
  cells: ParsedCell[];
  formulas: ParsedCell[];
  namedRanges?: { [key: string]: string };
  tables?: any[];
  charts?: any[];
}

interface ParsedExcel {
  fileName: string;
  fileSize: number;
  sheetsCount: number;
  sheets: ParsedSheet[];
  definedNames?: { [key: string]: string };
  summary: {
    formulaCount: number;
    totalCells: number;
    nonEmptyCells: number;
    sheetsWithFormulas: string[];
    complexityScore: number; // 0-100 score based on various metrics
  };
}

/**
 * Parse an Excel file and extract meaningful content for LLM analysis
 * @param buffer Buffer containing the Excel file data
 * @param fileName Original filename
 * @returns Structured representation of the Excel content
 */
export function parseExcelFile(buffer: Buffer, fileName: string): ParsedExcel {
  // Read the workbook from buffer
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellNF: true });
  
  // Initialize the parsing result
  const result: ParsedExcel = {
    fileName,
    fileSize: buffer.length,
    sheetsCount: workbook.SheetNames.length,
    sheets: [],
    summary: {
      formulaCount: 0,
      totalCells: 0,
      nonEmptyCells: 0,
      sheetsWithFormulas: [],
      complexityScore: 0
    }
  };
  
  // Process defined names if they exist
  if (workbook.Workbook?.Names?.length) {
    result.definedNames = {};
    workbook.Workbook.Names.forEach(name => {
      result.definedNames![name.Name] = name.Ref;
    });
  }
  
  // Track sheets with formulas
  const sheetsWithFormulas = new Set<string>();
  
  // Process each sheet
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    const parsedSheet: ParsedSheet = {
      name: sheetName,
      rows: range.e.r - range.s.r + 1,
      columns: range.e.c - range.s.c + 1,
      cells: [],
      formulas: []
    };
    
    let hasFormulas = false;
    let sheetTotalCells = parsedSheet.rows * parsedSheet.columns;
    let sheetNonEmptyCells = 0;
    
    // Extract cells
    Object.keys(worksheet).forEach(key => {
      // Skip metadata keys starting with '!'
      if (key.startsWith('!')) return;
      
      const cell = worksheet[key];
      if (!cell) return;
      
      sheetNonEmptyCells++;
      
      const parsedCell: ParsedCell = {
        address: key,
        value: cell.v,
        type: cell.t
      };
      
      // Capture formula if present
      if (cell.f) {
        parsedCell.formula = cell.f;
        parsedSheet.formulas.push(parsedCell);
        hasFormulas = true;
        result.summary.formulaCount++;
      }
      
      // Capture format if present
      if (cell.z) {
        parsedCell.format = cell.z;
      }
      
      parsedSheet.cells.push(parsedCell);
    });
    
    // Update summary with this sheet's data
    result.summary.totalCells += sheetTotalCells;
    result.summary.nonEmptyCells += sheetNonEmptyCells;
    
    if (hasFormulas) {
      sheetsWithFormulas.add(sheetName);
    }
    
    // Add the sheet to the result
    result.sheets.push(parsedSheet);
  });
  
  // Complete the summary
  result.summary.sheetsWithFormulas = Array.from(sheetsWithFormulas);
  
  // Calculate complexity score based on heuristics
  // - More sheets, more complex
  // - Higher formula density, more complex
  // - More defined names, more complex
  const sheetCountScore = Math.min(result.sheetsCount * 10, 30);
  const formulaDensityScore = Math.min((result.summary.formulaCount / Math.max(result.summary.nonEmptyCells, 1)) * 100, 40);
  const definedNamesScore = Math.min(Object.keys(result.definedNames || {}).length * 5, 30);
  
  result.summary.complexityScore = Math.min(
    sheetCountScore + formulaDensityScore + definedNamesScore,
    100
  );
  
  return result;
}

/**
 * Convert the parsed Excel data to a structured text representation for LLM analysis
 * @param parsedExcel The parsed Excel data
 * @returns A string representation of the Excel content suitable for LLM context
 */
export function excelToText(parsedExcel: ParsedExcel): string {
  const lines: string[] = [];
  
  // File overview
  lines.push(`EXCEL FILE ANALYSIS`);
  lines.push(`=================`);
  lines.push(`Filename: ${parsedExcel.fileName}`);
  lines.push(`File size: ${(parsedExcel.fileSize / 1024).toFixed(2)} KB`);
  lines.push(`Number of sheets: ${parsedExcel.sheetsCount}`);
  lines.push(`Complexity score: ${parsedExcel.summary.complexityScore}/100`);
  lines.push(`Total cells: ${parsedExcel.summary.totalCells}`);
  lines.push(`Non-empty cells: ${parsedExcel.summary.nonEmptyCells}`);
  lines.push(`Formula count: ${parsedExcel.summary.formulaCount}`);
  lines.push(``);
  
  // Defined names
  if (parsedExcel.definedNames && Object.keys(parsedExcel.definedNames).length > 0) {
    lines.push(`DEFINED NAMES`);
    lines.push(`============`);
    for (const [name, ref] of Object.entries(parsedExcel.definedNames)) {
      lines.push(`${name}: ${ref}`);
    }
    lines.push(``);
  }
  
  // For each sheet
  parsedExcel.sheets.forEach(sheet => {
    lines.push(`SHEET: ${sheet.name}`);
    lines.push(`${'='.repeat(sheet.name.length + 7)}`);
    lines.push(`Dimensions: ${sheet.rows} rows × ${sheet.columns} columns`);
    lines.push(`Cells: ${sheet.cells.length}`);
    lines.push(`Formulas: ${sheet.formulas.length}`);
    lines.push(``);
    
    // Show sample of first 10 non-empty cells
    if (sheet.cells.length > 0) {
      lines.push(`Sample cells:`);
      sheet.cells.slice(0, 10).forEach(cell => {
        let valueStr = String(cell.value);
        if (valueStr.length > 50) {
          valueStr = valueStr.substring(0, 47) + '...';
        }
        lines.push(`- ${cell.address}: ${valueStr}${cell.formula ? ` (Formula: ${cell.formula})` : ''}`);
      });
      lines.push(``);
    }
    
    // Show up to 20 formulas for this sheet
    if (sheet.formulas.length > 0) {
      lines.push(`Sample formulas:`);
      sheet.formulas.slice(0, 20).forEach(cell => {
        lines.push(`- ${cell.address}: ${cell.formula}`);
      });
      lines.push(``);
    }
  });
  
  return lines.join('\n');
} 