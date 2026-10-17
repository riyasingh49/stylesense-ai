import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),

  APP_BASE_URL: z.string().url().default("http://localhost:4000"),

  SUPABASE_URL: z.string().url().optional(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  DISCOVERY_SEARCH_PROVIDER: z
    .literal("langsearch")
    .default("langsearch"),

  LEAD_EXTRACTION_PROVIDER: z
    .enum(["mock", "gemini"])
    .default("gemini"),

  GEMINI_API_KEY: z.string().optional(),

  LANGSEARCH_API_KEY: z.string().optional(),

  EMAIL_PROVIDER: z.literal("mock").default("mock"),

  EMAIL_TEST_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  TRACKING_TOKEN_SECRET: z
    .string()
    .min(32, "TRACKING_TOKEN_SECRET must contain at least 32 characters"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid server environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  throw new Error("Server environment validation failed.");
}

const env = result.data;

if (
  env.DISCOVERY_SEARCH_PROVIDER === "langsearch" &&
  !env.LANGSEARCH_API_KEY
) {
  throw new Error(
    "LANGSEARCH_API_KEY is required when DISCOVERY_SEARCH_PROVIDER=langsearch.",
  );
}

if (
  env.LEAD_EXTRACTION_PROVIDER === "gemini" &&
  !env.GEMINI_API_KEY
) {
  throw new Error(
    "GEMINI_API_KEY is required when LEAD_EXTRACTION_PROVIDER=gemini.",
  );
}

export { env };
export type AppEnv = typeof env;
