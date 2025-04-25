# Glintify

Glintify is a desktop application that allows users to enrich Excel data with AI-powered insights from the web. This application uses a combination of web scraping and AI analysis to add intelligent content to your spreadsheets.

<div align="center">
  <img src="resources/glintify-logo.png" alt="Glintify Logo" width="200" />
</div>

## Features

- **Excel Data Enhancement**: Import Excel files (.xlsx) and enrich them with AI-generated content based on website data.
- **Web Scraping**: Automatically visit websites mentioned in your Excel file and capture screenshots.
- **AI Analysis**: Use AI to interpret website content and generate meaningful insights based on custom prompts.
- **Customizable Prompts**: Define specific prompts for the AI to target exactly what information you need.
- **Progress Tracking**: Real-time progress indicators and detailed logs during the enrichment process.
- **Automated Workspace**: All processing results are saved to a dedicated workspace folder for easy access.

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/glintify.git
cd glintify
```

2. Install dependencies:
```bash
npm install
# or 
yarn
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Build the application:
```bash
npm run build
# or
yarn build
```

### Building Distributable Packages

Build for your specific platform:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

## How to Use

1. **Launch the Application**: Open Glintify and you'll be presented with the home screen.

2. **Upload Excel File**: Drag and drop or click to browse for an Excel file containing website URLs or names.

3. **Select Website Column**: Choose which column in your Excel file contains the website URLs or names.

4. **Configure AI Prompts**: Add one or more AI prompts to extract specific information from each website. For example:
   - Column Name: "Product Description"
   - AI Prompt: "Generate a detailed product description based on the website content"

5. **Start Enrichment**: Click "Start Enrichment" to begin the process. Glintify will:
   - Visit each website
   - Take screenshots
   - Process the content with AI based on your prompts
   - Generate enriched data

6. **Monitor Progress**: Watch the real-time progress and logs as Glintify processes each row.

7. **Get Results**: When complete, download the enriched Excel file or open the workspace folder to access all generated files.

## Workspace Structure

Glintify automatically creates a workspace folder at `~/Documents/Glintify Workspace` containing:

- Original uploaded Excel files
- Enriched Excel files with timestamps
- Screenshots of visited websites
- Log files in JSON format

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Electron, React, and TypeScript
- Uses Tailwind CSS for styling
- Powered by Vite for fast development and building