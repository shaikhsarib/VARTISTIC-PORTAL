/**
 * Consistent error envelope for the versioned API.
 * Every error response: { error: { code, message, details? } }.
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class ApiError extends Error {
  code: ApiErrorCode;
  details?: unknown;
  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export function errorBody(code: ApiErrorCode, message: string, details?: unknown) {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

export function jsonError(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json(errorBody(err.code, err.message, err.details), { status: err.status });
  }
  // unexpected — log safely upstream; return generic envelope
  return Response.json(errorBody("INTERNAL", "Something went wrong. Try again."), { status: 500 });
}
