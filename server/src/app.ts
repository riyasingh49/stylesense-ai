import express, {
    type ErrorRequestHandler,
    type Request,
    type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import { env } from "./config/env";
import { companyRouter } from "./routes/company-routes";
import { sendError } from "./utils/api-response";
import { leadRouter } from "./routes/lead-routes";

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

app.use(express.json({ limit: "1mb", strict: true }));

app.get("/api/health", (_req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        data: {
            status: "ok",
            service: "stylesense-ai-server",
            timestamp: new Date().toISOString(),
        },
    });
});

// Company endpoints
app.use("/api/companies", companyRouter);

// Lead endpoints
app.use("/api/leads", leadRouter);

// Return a consistent response for unknown endpoints.
app.use((_req: Request, res: Response) => {
    return sendError(
        res,
        404,
        "NOT_FOUND",
        "The requested endpoint was not found.",
    );
});

// Centralized error handler
const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    _next,
) => {
    if (res.headersSent) {
        return;
    }

    if (
        error instanceof SyntaxError &&
        "body" in error
    ) {
        sendError(res, 400, "INVALID_JSON", "The request body contains invalid JSON.");
        return;
    }

    if (error instanceof ZodError) {
        sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "The request contains invalid data.",
            error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        );
        return;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.too.large"
    ) {
        sendError(
            res,
            413,
            "PAYLOAD_TOO_LARGE",
            "The request body exceeds the 1 MB limit.",
        );
        return;
    }

    console.error("Unhandled request error:", error);

    sendError(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        "An unexpected server error occurred.",
    );
};

app.use(errorHandler);

export { app };
