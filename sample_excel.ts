// import ExcelJS from 'exceljs';
const Excel = require('exceljs')



async function readExcelFile() {
  try {
    // Create a new workbook instance
    const workbook = new Excel.Workbook()

    // Path to the example Excel file - adjust this path as needed
    const filePath = '/home/gogosoon/Downloads/example.xlsx'

    // Read the Excel file
    console.log(`Reading Excel file: ${filePath}`)
    await workbook.xlsx.readFile(filePath)

    // For each worksheet in the workbook
    workbook.eachSheet((worksheet) => {
      console.log(`\nWorksheet: ${worksheet.name}`)

      // Get all rows
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        let rowOutput = `Row ${rowNumber}: `

        // Explicitly iterate through cells to avoid typing issues
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          let displayValue = excel_value_to_string(cell.value)

          // Extract cell value based on type

          rowOutput += `[Col ${colNumber}: ${displayValue}]\t`
        })

        console.log(rowOutput)
      })
    })

    console.log('\nExcel file reading completed successfully.')
  } catch (error) {
    console.error('Error reading Excel file:', error)
  }
}

// Execute the function
readExcelFile()
