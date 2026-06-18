FROM node:20-alpine

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy packages
COPY packages ./packages

# Copy worker app
COPY apps/worker ./apps/worker

# Install pnpm
RUN npm install -g pnpm@10.33.4

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm --filter @blueprint/worker build

# Start the worker
CMD ["pnpm", "--filter", "@blueprint/worker", "start"]
