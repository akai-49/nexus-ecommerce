import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/catalog_db?schema=public",
  },
  migrations: {
    seed: "node dist/prisma/seed.js",
  },
});
