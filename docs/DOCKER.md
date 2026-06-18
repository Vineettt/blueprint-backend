# Docker Setup

## Quick Setup
```bash
./scripts/docker-setup.sh
```

## Commands

### Development
```bash
docker-compose -f infrastructure/docker-compose.dev.yml up -d
```

### Production
```bash
docker-compose up -d
```

### Stop
```bash
docker-compose down
```

### Logs
```bash
docker-compose logs -f api
```

### Build
```bash
docker-compose build
```

## Access

- **API**: http://localhost:3000
- **Health**: http://localhost:3000/api/health
- **Redis GUI**: http://localhost:8081 (with tools profile)
- **pgAdmin**: http://localhost:8080 (with tools profile)
