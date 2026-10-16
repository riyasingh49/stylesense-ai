import type {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";
import { z } from "zod";
import { sendError } from "../utils/api-response";

type RequestPart = "body" | "query" | "params";

interface ValidationSchemas {
    body?: z.ZodType;
    query?: z.ZodType;
    params?: z.ZodType;
}

export const validateRequest = (
    schemas: ValidationSchemas,
): RequestHandler => {
    return (
        req: Request,
        res: Response,
        next: NextFunction,
    ): void => {
        const validated: Partial<Record<RequestPart, unknown>> = {};

        for (const part of ["body", "query", "params"] as const) {
            const schema = schemas[part];

            if (!schema) {
                continue;
            }

            const result = schema.safeParse(req[part]);

            if (!result.success) {
                sendError(
                    res,
                    400,
                    "VALIDATION_ERROR",
                    `Invalid request ${part}.`,
                    result.error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                );
                return;
            }

            validated[part] = result.data;
        }

        res.locals.validated = validated;
        next();
    };
};
