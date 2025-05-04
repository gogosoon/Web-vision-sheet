# SpreadsheetFlow Desktop Application

## Project Overview

SpreadsheetFlow is an Electron-based desktop application that automates the enrichment of Excel spreadsheets with AI-generated insights from website screenshots. The main workflow is:

1. Users upload an Excel file containing website URLs
2. The app takes screenshots of these websites using Puppeteer
3. The screenshots are processed using an AI service
4. Results are added to the Excel file as new columns

## Technology Stack

- **Framework**: Electron + React + TypeScript
- **UI**: React with Tailwind CSS
- **State Management**: Zustand
- **Excel Processing**: ExcelJS
- **Web Automation**: Puppeteer (with Stealth Plugin)
- **Authentication**: Token-based with secure storage

## Project Structure

```
spreadsheetflow-desktop-app/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # Main application entry point
│   │   ├── excelService.ts   # Excel file processing
│   │   ├── webService.ts     # Web automation & screenshot capture
│   │   ├── aiService.ts      # AI processing of screenshots
│   │   ├── tokenStorage.ts   # Secure token management
│   │   └── const.ts          # App-wide constants
│   ├── preload/              # Secure IPC bridge scripts
│   │   ├── index.ts          # Exposes main process APIs to renderer
│   │   └── index.d.ts        # TypeScript definitions
│   └── renderer/             # React UI application
│       ├── src/              # React source code
│       │   ├── components/   # Reusable UI components
│       │   ├── screens/      # Application screens
│       │   │   ├── HomeScreen.tsx      # File upload & configuration
│       │   │   ├── ProcessingScreen.tsx # Processing progress display
│       │   │   ├── ResultsScreen.tsx   # Displays processed results
│       │   │   └── LoginScreen.tsx     # User authentication
│       │   ├── lib/          # Utilities and services
│       │   │   └── store.ts  # Zustand state management
│       │   ├── App.tsx       # Main React component
│       │   └── main.tsx      # React entry point
│       ├── index.html        # HTML template
│       └── tailwind.css      # CSS styles
├── resources/                # Application resources
├── electron-builder.yml      # Electron build configuration
└── package.json              # Project dependencies & scripts
```

## Core Components

### Main Process Services

1. **ExcelHandler (`excelService.ts`)**
   - Reads and parses Excel files
   - Adds new columns based on AI processing results
   - Writes results back to Excel

2. **WebService (`webService.ts`)**
   - Manages Puppeteer browser instances
   - Takes screenshots of websites
   - Handles navigation and rendering

3. **AiService (`aiService.ts`)**
   - Sends screenshots to backend AI service
   - Processes AI responses with user-defined prompts
   - Handles authentication and rate limiting

4. **TokenStorage (`tokenStorage.ts`)**
   - Securely stores and retrieves authentication tokens
   - Handles token validation and refresh

### Renderer Process (UI)

1. **HomeScreen**
   - File upload and validation
   - Website URL column selection
   - AI prompt configuration

2. **ProcessingScreen**
   - Real-time progress tracking
   - Log display and error handling

3. **ResultsScreen**
   - Displays processing summary
   - Allows opening the generated file

4. **LoginScreen**
   - User authentication
   - Account management

## Application Flow

1. **Authentication**
   - User logs in via web-based OAuth
   - Auth token is securely stored

2. **Project Setup**
   - User uploads an Excel file containing URLs
   - Selects the column containing website URLs
   - Configures AI prompts for data extraction

3. **Processing**
   - Main process creates a workspace directory
   - For each URL in the Excel file:
     - Takes a screenshot using Puppeteer
     - Sends screenshot to AI service
     - Processes AI response
     - Adds results to the Excel file

4. **Results**
   - Enriched Excel file is saved
   - User can view and export results

## Key Files

- **`main/index.ts`**: Main Electron process with IPC handlers
- **`main/excelService.ts`**: Excel file processing logic
- **`main/webService.ts`**: Web automation with Puppeteer
- **`main/aiService.ts`**: AI integration
- **`renderer/src/lib/store.ts`**: Application state management
- **`renderer/src/screens/HomeScreen.tsx`**: Main UI for file configuration
- **`preload/index.ts`**: Secure bridge between main and renderer
