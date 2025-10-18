/**
 * Validate command - Validate a config file
 */

import type { Config } from '../../types/config';
import { loadConfig, ConfigLoadError } from '../utils/config-loader';

/**
 * Options for validate command
 */
export interface ValidateOptions {
  /** Path to config file */
  config: string;
}

/**
 * Summary of config file
 */
export interface ConfigSummary {
  name: string;
  url: string;
  maxPages: number;
  categoryCount: number;
  rateLimit: number;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  /** Whether config is valid */
  isValid: boolean;
  /** Path to config file */
  filePath: string;
  /** Parsed config (only if valid) */
  config?: Config;
  /** Summary of config (only if valid) */
  summary?: ConfigSummary;
  /** Validation errors (only if invalid) */
  errors?: string[];
}

/**
 * Execute validate command
 * Validates a config file and returns detailed results
 */
export async function validateCommand(options: ValidateOptions): Promise<ValidationResult> {
  try {
    // Load and validate config
    const config = await loadConfig(options.config);

    // Create summary
    const summary: ConfigSummary = {
      name: config.name,
      url: config.base_url,
      maxPages: config.max_pages,
      categoryCount: config.categories ? Object.keys(config.categories).length : 0,
      rateLimit: config.rate_limit,
    };

    return {
      isValid: true,
      filePath: options.config,
      config,
      summary,
    };
  } catch (error) {
    // Handle validation errors
    if (error instanceof ConfigLoadError) {
      const errors: string[] = [];

      if (error.validationErrors) {
        // Schema validation errors
        errors.push(...error.validationErrors.map((e) => `${e.path}: ${e.message}`));
      } else {
        // File or JSON errors
        errors.push(error.message);
      }

      return {
        isValid: false,
        filePath: options.config,
        errors,
      };
    }

    // Unexpected error
    return {
      isValid: false,
      filePath: options.config,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
