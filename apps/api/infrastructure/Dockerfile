FROM node:20-alpine

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy packages
COPY packages ./packages

# Copy API app
COPY apps/api ./apps/api

# Install pnpm
RUN npm install -g pnpm@10.33.4

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm --filter @blueprint/api build

# Start the API
CMD ["pnpm", "--filter", "@blueprint/api", "start"]
