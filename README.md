# spreadsheetflow

## Development

### Prerequisites

- Node.js 20+ and npm


### Important note for mac

Please install this and make sure you using v22 node version

```
npm install @rollup/rollup-darwin-arm64
```


### Building for Production / Release the app

Build the application for your platform:

```bash
npm run build
```

For specific platforms:

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Release the app

1. Update the package.json version
2. Tag the version

```bash
git tag v1.2.3
```

3. Push the tag to github https://github.com/saran-gogosoon/spreadsheetflow_desktop 
```
git push github v1.2.3
```


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
