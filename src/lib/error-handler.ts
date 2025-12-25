/**
 * Error Handler
 * 
 * Centralized error handling for API routes and client-side errors.
 * Provides consistent error responses and logging.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any[]) {
    super(400, message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, message, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(403, message, "FORBIDDEN_ERROR");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, message, "NOT_FOUND_ERROR");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(409, message, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(429, message, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

// ============================================
// Error Handler Function
// ============================================

export function handleError(error: unknown): NextResponse {
  console.error("Error occurred:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { details: error.errors }),
      },
      { status: error.statusCode }
    );
  }

  // Generic Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  // Unknown error
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

// ============================================
// Prisma Error Handler
// ============================================

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(", ") || "field";
      return NextResponse.json(
        {
          error: `This ${field} already exists`,
          code: "DUPLICATE_ERROR",
        },
        { status: 409 }
      );

    case "P2025":
      // Record not found
      return NextResponse.json(
        {
          error: "Resource not found",
          code: "NOT_FOUND_ERROR",
        },
        { status: 404 }
      );

    case "P2003":
      // Foreign key constraint violation
      return NextResponse.json(
        {
          error: "Related resource not found or invalid reference",
          code: "INVALID_REFERENCE_ERROR",
        },
        { status: 400 }
      );

    case "P2014":
      // Invalid relation
      return NextResponse.json(
        {
          error: "Invalid relation in the query",
          code: "INVALID_RELATION_ERROR",
        },
        { status: 400 }
      );

    default:
      // Other Prisma errors
      console.error("Prisma error:", error.code, error.message);
      return NextResponse.json(
        {
          error: "Database error occurred",
          code: "DATABASE_ERROR",
        },
        { status: 500 }
      );
  }
}

// ============================================
// Async Error Wrapper
// ============================================

/**
 * Wraps an async function to catch errors and handle them consistently
 * 
 * Usage:
 * export const GET = asyncErrorHandler(async (request) => {
 *   // your code here
 * });
 */
export function asyncErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  }) as T;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Assert that a value is not null/undefined, throw NotFoundError if it is
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = "Resource not found"
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
}

/**
 * Assert that user is authenticated, throw AuthenticationError if not
 */
export function assertAuthenticated(
  user: any,
  message: string = "Unauthorized"
): void {
  if (!user) {
    throw new AuthenticationError(message);
  }
}

/**
 * Assert that user has permission, throw ForbiddenError if not
 */
export function assertAuthorized(
  hasPermission: boolean,
  message: string = "Forbidden"
): void {
  if (!hasPermission) {
    throw new ForbiddenError(message);
  }
}

// ============================================
// Success Response Helpers
// ============================================

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data, success: true }, { status });
}

export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json({ data, success: true }, { status: 201 });
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

