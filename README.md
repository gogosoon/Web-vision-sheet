# Glintify

Glintify is a powerful desktop application for AI-powered data enrichment, allowing users to easily enhance Excel files with AI-generated insights about website data.

## Features

- **Excel File Processing**: Import Excel files directly into the application
- **Website Column Selection**: Select which column contains website URLs for enrichment
- **AI Enrichment**: Add AI-powered insights to your data
- **Custom Prompts**: Define custom AI prompts for tailored data enrichment
- **Batch Processing**: Efficiently process large datasets with visual progress tracking
- **Export Results**: Save enriched data back to Excel format

## Application Structure

Glintify is built with a modern tech stack:

- **Electron**: For cross-platform desktop capabilities
- **React & TypeScript**: For a robust and type-safe UI
- **Tailwind CSS**: For modern, responsive styling
- **ExcelJS**: For Excel file manipulation
- **Zustand**: For state management

## Development

### Prerequisites

- Node.js 16+ and npm

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/glintify.git
   cd glintify
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Building for Production

Build the application for your platform:

```
npm run build
```

For specific platforms:

```
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## How It Works

1. **Import Data**: Upload an Excel file (.xlsx) with a column containing website URLs
2. **Configure**: Select the website column and define custom AI prompts
3. **Process**: Glintify processes each website, taking "screenshots" and analyzing content
4. **Review**: View results and download the enriched Excel file

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts for secure IPC
└── renderer/       # React application
    ├── components/ # Reusable UI components
    ├── lib/        # Core services and utilities
    └── screens/    # Application screens
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT