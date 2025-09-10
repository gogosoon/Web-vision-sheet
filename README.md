# webvisionsheet

## Development

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (if using default configuration)

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
```

Replace the values with your actual database configuration.

### Database Configuration

This project is configured to use **PostgreSQL** by default. If you want to use a different database:

1. **Change the database type** in `src/main/database/data-source.ts`:
   ```typescript
   export const AppDataSource = new DataSource({
     type: 'mysql', // Change from 'postgres' to your preferred type
     // ... rest of configuration
   })
   ```

2. **Remove existing migrations** from `src/main/database/migrations/` directory

3. **Generate new migration** for your database setup:
   ```bash
   npm run db:new
   ```

### Database Migration Commands

- **Generate a new migration**:
  ```bash
  npm run db:new
  ```
  This creates a new migration file based on entity changes.

- **Run migrations** (apply pending migrations to database):
  ```bash
  npm run db:migrate
  ```

- **Rollback the last migration**:
  ```bash
  npm run db:rollback
  ```

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

3. Push the tag to github https://github.com/gogosoon/Web-vision-sheet 
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
