import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/db/src/auth",
  out: "./drizzle/auth",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_AUTH_URL!,
  },
  verbose: true,
  strict: true,
});
