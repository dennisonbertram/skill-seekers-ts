/**
 * Validation utilities for runtime type checking with Zod
 */

import { z, ZodError } from 'zod';
import { logger } from './logger';

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates data against a Zod schema and throws ValidationError on failure
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param context - Optional context string for error messages
 * @returns The validated data with proper typing
 * @throws ValidationError if validation fails
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const contextMsg = context ? ` in ${context}` : '';
      logger.error(`Validation failed${contextMsg}`, {
        errors: error.errors,
        data,
      });
      throw new ValidationError(
        `Validation failed${contextMsg}: ${error.errors.map((e) => e.message).join(', ')}`,
        error.errors,
      );
    }
    throw error;
  }
}

/**
 * Safely validates data against a Zod schema without throwing
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns A discriminated union result indicating success or failure
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.errors };
}