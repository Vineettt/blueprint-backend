# CI/CD Pipeline

## Workflows

### Test Suite
- Triggers: push to main/develop, PR to main
- Jobs: unit tests, integration tests, performance tests

### Docker Build
- Triggers: push to main/develop, tags, PR to main
- Builds and pushes to GitHub Container Registry
- Generates SBOM

### Security
- Security scanning and vulnerability detection

## Commands

### Run Tests
```bash
pnpm test:run
pnpm test:coverage
```

### Build
```bash
pnpm build
```

### Lint
```bash
pnpm lint:fix
```
