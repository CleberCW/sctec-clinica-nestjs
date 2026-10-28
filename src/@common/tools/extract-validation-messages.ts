import { ValidationError } from '@nestjs/common';

export function extractValidationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...extractValidationMessages(error.children ?? []),
  ]);
}
