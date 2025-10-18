/**
 * Configuration file loader with validation
 * Loads and validates config files using Zod schemas
 */

import { ConfigSchema, type Config } from '../../types/config';
import { readJsonFile, exists } from '../../utils/fs';
import { ZodError } from 'zod';

/**
 * Validation error details
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Custom error for config loading failures
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public filePath: string,
    public validationErrors?: ValidationError[],
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

/**
 * Load and validate a config file
 * @param filePath - Path to the config file
 * @returns Validated config object
 * @throws ConfigLoadError if file doesn't exist, has invalid JSON, or fails schema validation
 */
export async function loadConfig(filePath: string): Promise<Config> {
  // Check if file exists
  const fileExists = await exists(filePath);
  if (!fileExists) {
    throw new ConfigLoadError(`Config file not found: ${filePath}`, filePath);
  }

  // Read and parse JSON
  let rawData: unknown;
  try {
    rawData = await readJsonFile(filePath);
  } catch (error) {
    // Distinguish between read errors and JSON parse errors
    const message =
      error instanceof Error && error.message.includes('JSON')
        ? `Invalid JSON in config file: ${error.message}`
        : `Failed to read config file: ${error instanceof Error ? error.message : 'Unknown error'}`;

    throw new ConfigLoadError(message, filePath);
  }

  // Validate against schema
  try {
    const config = ConfigSchema.parse(rawData);
    return config;
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert Zod errors to our ValidationError format
      const validationErrors: ValidationError[] = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new ConfigLoadError(
        `Invalid config schema: ${validationErrors.map((e) => `${e.path}: ${e.message}`).join(', ')}`,
        filePath,
        validationErrors,
      );
    }

    // Unexpected error
    throw new ConfigLoadError(
      `Failed to validate config: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath,
    );
  }
}
