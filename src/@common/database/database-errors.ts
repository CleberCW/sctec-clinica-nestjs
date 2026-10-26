import { QueryFailedError } from 'typeorm';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(
  error: unknown,
  constraint?: string,
): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as PostgresDriverError;

  return (
    driverError.code === '23505' &&
    (constraint === undefined || driverError.constraint === constraint)
  );
}
