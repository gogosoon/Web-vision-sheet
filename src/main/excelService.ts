import * as Excel from 'exceljs'
import { AiPrompt } from './aiService' // Adjusted import path assumption
import path from 'node:path' // Use Node.js path
import { WebService } from './webService' // Adjusted import path assumption
import { AiService } from './aiService' // Adjusted import path assumption
import { BrowserWindow } from 'electron' // For sending progress

// Define a type for the progress callback, matching the webContents.send signature
type ProgressCallback = (stats: { currentRowIndex: number, totalRows: number, currentLogMessage: string }) => void;


function excel_value_to_string(value) {
  let displayValue = ''
  if (value === null || value === undefined) {
    displayValue = ''
  } else if (value instanceof Date) {
    displayValue = value.toISOString()
  } else if (typeof value === 'object') {
    if (value.text && typeof value.text === 'string') {
      displayValue = value.text
    }
    if (value.text && typeof value.text === 'object' && value.text.richText) {
      try {
        displayValue = value.text.richText?.map((text) => text.text).join('')
      } catch (e) {
        displayValue = '[Complex Value]'
      }
    }
  } else {
    displayValue = String(value)
  }
  return displayValue
}

/**
 * Service for Excel file operations (Main Process)
 */
export class ExcelHandler { // Renamed class slightly
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
  }

  private sendProgress(stats: { currentRowIndex: number, totalRows: number, currentLogMessage: string }) {
    this.mainWindow?.webContents.send('processingProgress', stats);
  }

  /**
   * Read Excel file info without loading all data (Main Process)
   */
  static async getFileInfo(filePath: string): Promise<{
    sheetNames: string[]
    columns: string[]
    totalRows: number
  }> {
    const workbook = new Excel.Workbook()
    // Use readFile for paths directly in main process
    await workbook.xlsx.readFile(filePath) 

    const sheetNames = workbook.worksheets.map(sheet => sheet.name)
    const firstSheet = workbook.worksheets[0]
    const columns: string[] = []

    // Get column names from the first row
    firstSheet.getRow(1).eachCell(cell => {
      if (cell.value) {
        columns.push(cell.value.toString())
      }
    })

    // Count total rows (excluding header)
    const totalRows = firstSheet.rowCount > 0 ? firstSheet.rowCount - 1 : 0;

    return {
      sheetNames,
      columns,
      totalRows
    }
  }

  /**
   * Read an Excel file with web URLs and create a new enriched file (Main Process)
   */
  async processFile(
    originalFilePath: string,
    websiteColumnName: string,
    aiPrompts: AiPrompt[], // Assuming AiPrompt might be defined in aiService now
    outputPath: string,
    screenshotsDir: string,
    // onProgress: ProgressCallback // Replaced with internal sendProgress
    webService: WebService, // Pass instances
    aiService: AiService   // Pass instances
  ): Promise<{filePath: string, logs: string[]}> {
    // Load the original file
    const workbook = new Excel.Workbook()
    await workbook.xlsx.readFile(originalFilePath)
    
    const worksheet = workbook.worksheets[0]
    const logs: string[] = []
    
    // Find the column index for the website URL
    let websiteColumnIndex = -1
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      if (cell.value?.toString() === websiteColumnName) {
        websiteColumnIndex = colNumber
      }
    })
    
    if (websiteColumnIndex === -1) {
      throw new Error(`Website column "${websiteColumnName}" not found in Excel file`)
    }
    
    logs.push(`Found website column "${websiteColumnName}" at index ${websiteColumnIndex}`)
    
    // Add new columns for AI-generated content
    // Ensure header row exists before adding columns
    const headerRow = worksheet.getRow(1);
    let startColumn = headerRow.cellCount + 1; // Start adding after the last existing cell

    // console.log("aiPrompts", aiPrompts);
    aiPrompts.forEach(prompt => {
      const newColumnName = prompt.columnName
      // Ensure we target the correct cell index for the new column
      headerRow.getCell(startColumn).value = newColumnName;
      logs.push(`Added new column: "${newColumnName}" at column index ${startColumn}`);
      startColumn++; // Increment for the next new column
    })

    // Ensure worksheet has rows before proceeding
    if (worksheet.rowCount <= 1) {
        logs.push('No data rows found in the Excel file.');
        // Optionally save the file with only headers if needed, or just return
        await workbook.xlsx.writeFile(outputPath);
        logs.push(`Saved file with headers (no data rows) to ${outputPath}`);
        return { filePath: outputPath, logs };
    }
    
    // Process each row (skip header row)
    const totalRows = worksheet.rowCount - 1
    logs.push(`Starting to process ${totalRows} rows...`)
        
    // Process each data row
    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      const currentRow = rowIndex - 1; // Current data row number (1-based for user display)
      const progressRowIndex = rowIndex - 2; // 0-based index for progress calculation

      const row = worksheet.getRow(rowIndex);

      // Get website URL
      let websiteUrl: any = row.getCell(websiteColumnIndex).value
      websiteUrl = excel_value_to_string(websiteUrl)
      if (!websiteUrl) {
        logs.push(`Row ${rowIndex}: Empty website URL, skipping...`)
        continue
      }
      // console.log("websiteUrl", websiteUrl)
      // Send progress update
      this.sendProgress({ 
        currentRowIndex: progressRowIndex, 
        totalRows, 
        currentLogMessage: `Processing row ${currentRow} of ${totalRows}: ${websiteUrl}` 
      });
      logs.push(`Row ${rowIndex}: Processing website "${websiteUrl}"...`)
      
      try {
        // Take screenshot
        const screenshotFileName = `screenshot-row-${rowIndex}.png`
        // Use Node.js path.join
        const screenshotPath = path.join(screenshotsDir, screenshotFileName) 
        
        logs.push(`Row ${rowIndex}: Taking screenshot of "${websiteUrl}"...`)
                
        // Use the passed WebService instance
        await webService.takeScreenshot(websiteUrl, screenshotPath)
        logs.push(`Row ${rowIndex}: Screenshot saved to "${screenshotPath}"`)
        
        // Extract content from the website (If needed, uncomment if WebService has this)
        // logs.push(`Row ${rowIndex}: Extracting content from "${websiteUrl}"...`)
        // const content = await WebService.extractContent(websiteUrl)
        
        // Process each AI prompt
        
        // Process the content with AI (Use passed AiService instance)
        const aiResult = await aiService.processScreenshot(
          screenshotPath,
          websiteUrl,
          aiPrompts
        )
        
        for (let promptIndex = 0; promptIndex < aiPrompts.length; promptIndex++) {
          const prompt = aiPrompts[promptIndex]
          logs.push(`Row ${rowIndex}: Processing prompt "${prompt.prompt}"...`)
          logs.push(`Row ${rowIndex}: AI generated result for "${prompt.columnName}"`)
          
          // Calculate the correct column index to add the result
          // This should correspond to the columns added earlier
          const resultColumnIndex = (worksheet.columnCount - aiPrompts.length) + promptIndex + 1;
          row.getCell(resultColumnIndex).value = aiResult?.[prompt.columnName] || ``;
        }
        logs.push(`Row ${rowIndex}: Processing completed`)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logs.push(`Row ${rowIndex}: Error processing - ${errorMessage}`)
        console.error(`Error processing row ${rowIndex}:`, error)
        
        // Add error message to the cells instead of the AI result
        aiPrompts.forEach((_, promptIndex) => {
          const resultColumnIndex = (worksheet.columnCount - aiPrompts.length) + promptIndex + 1;
          row.getCell(resultColumnIndex).value = `Error: ${errorMessage}`
        })
      } finally {
         // Save the workbook after processing each row to prevent data loss on crash
         await workbook.xlsx.writeFile(outputPath);
         logs.push(`Row ${rowIndex}: Saved intermediate progress to ${outputPath}`);
      }
    }
    
    logs.push('All rows processed, saving final enriched file...')
    
    // Final save (redundant if saving each row, but good practice)
    await workbook.xlsx.writeFile(outputPath)
    logs.push(`Enriched file saved to ${outputPath}`)
    
    return { filePath: outputPath, logs }
  }
}

// // Also define AiPrompt here if it's not imported from elsewhere
// export interface AiPrompt {
//   columnName: string;
//   prompt: string;
// } 