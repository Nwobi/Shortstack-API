import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_PATH: z.string().default("./data/shortstack.sqlite"),
  JWT_SECRET: z.string().min(10).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  BASE_URL: z.string().url().default("http://localhost:3000"),
  CACHE_MAX_SIZE: z.coerce.number().int().positive().default(500),
  LOG_LEVEL: z.string().default("info"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid env config:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
