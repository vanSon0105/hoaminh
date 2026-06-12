import { PrismaClient } from "@prisma/client";

import { env } from "../config/env.js";

const prismaClient =
  globalThis.__hoaminhPrisma ||
  new PrismaClient({
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"]
  });

if (env.nodeEnv !== "production") {
  globalThis.__hoaminhPrisma = prismaClient;
}

export const prisma = prismaClient;
