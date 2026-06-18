# Pre-commit Hooks

## Setup

### Install Husky
```bash
npm install husky
npx husky add .husky/pre-commit
chmod +x .husky/pre-commit
```

### Configuration
Pre-commit hooks run:
- ESLint with auto-fix
- Prettier formatting
- YAML linting for GitHub Actions

## What Gets Checked

- TypeScript files: `src/**/*.{ts,tsx,js}`
- Config files: `*.{json,md}`

## Manual Run
```bash
npx husky install
```
