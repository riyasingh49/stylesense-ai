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

  DISCOVERY_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),

  GEMINI_API_KEY: z.string().optional(),

  EMAIL_PROVIDER: z.enum(["mock", "resend"]).default("mock"),

  EMAIL_TEST_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  RESEND_API_KEY: z.string().optional(),

  EMAIL_FROM: z.string().optional(),

  TRACKING_TOKEN_SECRET: z
    .string()
    .min(32, "TRACKING_TOKEN_SECRET must contain at least 32 characters")
    .default("development-only-tracking-secret-change-me"),
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

if (env.DISCOVERY_PROVIDER === "gemini" && !env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required when DISCOVERY_PROVIDER=gemini.");
}

if (env.EMAIL_PROVIDER === "resend") {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required when EMAIL_PROVIDER=resend.",
    );
  }

  if (env.EMAIL_TEST_MODE) {
    throw new Error(
      "EMAIL_TEST_MODE must be false when EMAIL_PROVIDER=resend is selected.",
    );
  }
}

export { env };
export type AppEnv = typeof env;
