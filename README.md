# alpyaml

A modern Vue.js-based desktop environment simulator built with TypeScript, featuring window management, file operations, and interactive desktop functionality.

## Overview

alpyaml is a web-based desktop environment that mimics traditional operating system interfaces. It provides a fully interactive desktop experience with drag-and-drop file management, windowing system, context menus, and more.

## Features

- **Desktop Interface**: Interactive desktop with icons and background
- **Window Management**: Multi-window support with drag, resize, and minimize/maximize
- **File Operations**: Create, delete, rename files and folders
- **Drag & Drop**: Intuitive file and icon manipulation
- **Context Menus**: Right-click menus for desktop and file operations
- **File Explorer**: Browse and manage files in a familiar interface
- **Taskbar**: System tray with window management
- **Notifications**: Toast notifications for system events
- **Keyboard Shortcuts**: Common desktop shortcuts support
- **Responsive Design**: Adapts to different screen sizes

## Tech Stack

- **Frontend**: Vue 3, TypeScript, TailwindCSS
- **Build Tool**: Vite
- **Runtime**: Bun
- **State Management**: Pinia
- **Backend**: Elysia (Node.js framework)
- **Icons**: Material Design Icons
- **Testing**: Jest, Vue Test Utils

## Installation

1. Install [Bun](https://bun.com/) runtime
2. Clone the repository
3. Install dependencies:

```bash
bun install
```

## Development

### Frontend Development Server

```bash
bun run dev
```

This will start the Vite development server at `http://localhost:5173/`

### Backend Server

```bash
bun run backend
```

### Build for Production

```bash
bun run build
```

### Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Project Structure

```
alpyaml/
├── src/
│   ├── components/     # Vue components (Desktop, WindowManager, etc.)
│   ├── composables/    # Vue composables for shared logic
│   ├── stores/         # Pinia stores for state management
│   ├── types/          # TypeScript type definitions
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── demo/           # Demo files
├── backend/            # Elysia backend server
├── public/             # Static assets
└── test/               # Test files
```

## Development Workflow

### Code Quality

This project uses several tools to maintain high code quality:

#### Linting
```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

#### Formatting
```bash
# Check code formatting
npm run format:check

# Format code automatically
npm run format
```

#### TypeScript
The project uses strict TypeScript settings for maximum type safety:
- `strict: true` - Enables all strict type checking options
- `exactOptionalPropertyTypes` - Ensures optional properties are handled correctly
- `noImplicitOverride` - Prevents accidental method overrides
- `noImplicitReturns` - Ensures all code paths return a value
- `noUncheckedIndexedAccess` - Prevents unsafe array/object access

#### Testing
```bash
# Run all tests
npm run test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

**Coverage Thresholds:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

#### Quality Gates
```bash
# Run all quality checks (lint + format + test coverage)
npm run quality

# Fix all auto-fixable issues
npm run quality:fix
```

## Scripts

- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build
- `lint`: Check for linting issues
- `lint:fix`: Fix linting issues automatically
- `format`: Format code automatically
- `format:check`: Check code formatting
- `test`: Run tests
- `test:ui`: Run tests with UI
- `test:watch`: Run tests in watch mode
- `test:coverage`: Run tests with coverage
- `quality`: Run all quality checks
- `quality:fix`: Fix all auto-fixable issues
- `backend`: Start backend server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
