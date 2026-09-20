export type AppErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_TRANSITION'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export type AppError = {
  readonly code: AppErrorCode
  readonly message: string
  readonly details?: Record<string, unknown>
}

export function appError(
  code: AppErrorCode,
  message: string,
  details?: Record<string, unknown>,
): AppError {
  return { code, message, ...(details ? { details } : {}) }
}
