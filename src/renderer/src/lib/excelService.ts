import * as Excel from 'exceljs'
import { AiPrompt } from './store'

/**
 * Service for Excel file operations
 */
export class ExcelService {
  /**
   * Read Excel file info without loading all data
   */
  static async getFileInfo(file: File): Promise<{
    sheetNames: string[]
    columns: string[]
    totalRows: number
  }> {
    const workbook = new Excel.Workbook()
    const arrayBuffer = await file.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)

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
    const totalRows = firstSheet.rowCount - 1

    return {
      sheetNames,
      columns,
      totalRows
    }
  }

  /**
   * Read an Excel file with web URLs and create a new enriched file
   */
  static async processFile(
    originalFilePath: string,
    websiteColumnName: string,
    aiPrompts: AiPrompt[],
    outputPath: string,
    screenshotsDir: string,
    onProgress: (row: number, total: number, websiteUrl: string) => void
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
    aiPrompts.forEach(prompt => {
      const newColumnName = prompt.columnName
      worksheet.getRow(1).getCell(worksheet.columnCount + 1).value = newColumnName
      logs.push(`Added new column: "${newColumnName}"`)
    })
    
    // Process each row (skip header row)
    const totalRows = worksheet.rowCount - 1
    logs.push(`Starting to process ${totalRows} rows...`)
    
    // Import WebService and AiService dynamically (to avoid module not found errors in browser)
    const { WebService } = await import('./webService')
    const { AiService } = await import('./aiService')
    
    // Process each row
    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      // Update progress
      const currentRow = rowIndex - 2
      
      // Get website URL
      const websiteUrl = worksheet.getRow(rowIndex).getCell(websiteColumnIndex).value?.toString() || ''
      if (!websiteUrl) {
        logs.push(`Row ${rowIndex}: Empty website URL, skipping...`)
        continue
      }
      
      onProgress(currentRow, totalRows, websiteUrl)
      logs.push(`Row ${rowIndex}: Processing website "${websiteUrl}"...`)
      
      try {
        // Take screenshot
        const screenshotFileName = `screenshot-row-${rowIndex}.png`
        const screenshotPath = await window.api.path.join(screenshotsDir, screenshotFileName)
        
        logs.push(`Row ${rowIndex}: Taking screenshot of "${websiteUrl}"...`)
        
        // In our case, we're not actually taking a screenshot, but we're simulating it
        await WebService.takeScreenshot(websiteUrl, screenshotPath)
        logs.push(`Row ${rowIndex}: Screenshot saved to "${screenshotPath}"`)
        
        // Extract content from the website
        logs.push(`Row ${rowIndex}: Extracting content from "${websiteUrl}"...`)
        const content = await WebService.extractContent(websiteUrl)
        
        // Process each AI prompt
        for (let promptIndex = 0; promptIndex < aiPrompts.length; promptIndex++) {
          const prompt = aiPrompts[promptIndex]
          logs.push(`Row ${rowIndex}: Processing prompt "${prompt.prompt}"...`)
          
          // Process the content with AI
          const aiResult = await AiService.processScreenshot(
            screenshotPath,
            websiteUrl,
            prompt.prompt
          )
          
          logs.push(`Row ${rowIndex}: AI generated result for "${prompt.columnName}"`)
          
          // Add result to the Excel file
          const newColumnIndex = worksheet.columnCount - aiPrompts.length + promptIndex
          worksheet.getRow(rowIndex).getCell(newColumnIndex + 1).value = aiResult
        }
        
        logs.push(`Row ${rowIndex}: Processing completed`)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logs.push(`Row ${rowIndex}: Error processing - ${errorMessage}`)
        console.error(`Error processing row ${rowIndex}:`, error)
        
        // Add error message to the cells instead of the AI result
        aiPrompts.forEach((_, promptIndex) => {
          const newColumnIndex = worksheet.columnCount - aiPrompts.length + promptIndex
          worksheet.getRow(rowIndex).getCell(newColumnIndex + 1).value = `Error: ${errorMessage}`
        })
      }
    }
    
    logs.push('All rows processed, saving enriched file...')
    
    // Save the enriched file
    await workbook.xlsx.writeFile(outputPath)
    logs.push(`Enriched file saved to ${outputPath}`)
    
    return { filePath: outputPath, logs }
  }
} 