# Agent Guidelines

## Commands
- **Package manager**: `pnpm`
- **Run tests**: `pnpm test` (runs all tests with Vitest)
- **Run single test**: `pnpm test test/fetch-title.test.ts` (specify file path)
- **Lint**: `pnpm lint` (ESLint)
- **Lint fix**: `pnpm lint:fix`
- **Run app**: `pnpm start /path/to/markdown`

## Code Style (Antfu ESLint Config)
- **Indentation**: Tabs (not spaces)
- **Quotes**: Single quotes
- **Semicolons**: No semicolons
- **Types**: TypeScript strict mode, explicit return types on exported functions
- **Imports**: Node imports use `node:` prefix (e.g., `node:fs/promises`), relative imports with `.js` extension
- **Error handling**: Use try-catch with empty catch blocks returning null/default values
- **Naming**: camelCase for functions/variables, PascalCase for types/interfaces
- **Console**: `console.log` and `console.error` allowed (no-console disabled)
- **Process**: Use `process` global directly (prefer-global/process disabled)
