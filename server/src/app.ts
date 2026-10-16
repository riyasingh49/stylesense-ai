
import express, {
    type ErrorRequestHandler,
    type Request,
    type Response,
  } from "express";
  import cors from "cors";
  import helmet from "helmet";
  import { ZodError } from "zod";
  import { env } from "./config/env";
  
  const app = express();
  
  app.disable("x-powered-by");
  
  app.use(helmet());
  
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  
  app.use(
    express.json({
      limit: "1mb",
      strict: true,
    }),
  );
  
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        service: "stylesense-ai-server",
        timestamp: new Date().toISOString(),
      },
    });
  });
  
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "The requested endpoint was not found.",
      },
    });
  });
  
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent) {
      return;
    }
  
    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "The request body contains invalid JSON.",
        },
      });
      return;
    }
  
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The request contains invalid data.",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }
  
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.too.large"
    ) {
      res.status(413).json({
        success: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "The request body must not exceed 1 MB.",
        },
      });
      return;
    }
  
    console.error("Unhandled request error:", error);
  
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  };
  
  app.use(errorHandler);
  
  export { app };
  