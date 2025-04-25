import * as Excel from 'exceljs'
import path from 'path'
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
    onProgress: (row: number, total: number) => void
  ): Promise<string> {
    // Load the original file
    const workbook = new Excel.Workbook()
    await workbook.xlsx.readFile(originalFilePath)
    
    const worksheet = workbook.worksheets[0]
    
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
    
    // Add new columns for AI-generated content
    aiPrompts.forEach(prompt => {
      worksheet.getRow(1).getCell(worksheet.columnCount + 1).value = prompt.columnName
    })
    
    // Process each row (skip header row)
    const totalRows = worksheet.rowCount - 1
    
    // In a real implementation, you would:
    // 1. Process rows one by one
    // 2. For each row, extract the website URL
    // 3. Use Puppeteer to visit the website and take screenshots
    // 4. Process each screenshot with OpenAI API
    // 5. Add results to the new columns
    
    // For now, we'll just add mock data
    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      // Update progress
      onProgress(rowIndex - 2, totalRows)
      
      // Get website URL
      const websiteUrl = worksheet.getRow(rowIndex).getCell(websiteColumnIndex).value?.toString() || ''
      
      // Add mock data for each AI prompt
      aiPrompts.forEach((prompt, promptIndex) => {
        const newColumnIndex = worksheet.columnCount - aiPrompts.length + promptIndex
        const mockResult = `AI-generated content for "${websiteUrl}" using prompt: "${prompt.prompt}"`
        worksheet.getRow(rowIndex).getCell(newColumnIndex + 1).value = mockResult
      })
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Save the enriched file
    await workbook.xlsx.writeFile(outputPath)
    
    return outputPath
  }
} 