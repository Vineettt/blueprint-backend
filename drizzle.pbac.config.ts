import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/db/src/pbac",
  out: "./drizzle/pbac",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_PBAC_URL!,
  },
  verbose: true,
  strict: true,
});
