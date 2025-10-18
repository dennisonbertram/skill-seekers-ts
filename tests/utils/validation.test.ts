import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
// Import utilities that don't exist yet - this will cause tests to fail (RED phase)
import { validateWithSchema, safeValidate, ValidationError } from '../../src/utils/validation';

// Mock logger to avoid console noise during tests
vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('ValidationError', () => {
  it('should be an instance of Error', () => {
    const error = new ValidationError('Test error', []);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name', () => {
    const error = new ValidationError('Test error', []);
    expect(error.name).toBe('ValidationError');
  });

  it('should store validation errors', () => {
    const zodIssues = [
      {
        code: 'invalid_type' as const,
        expected: 'string' as const,
        received: 'number' as const,
        path: ['field'],
        message: 'Expected string, received number',
      },
    ];
    const error = new ValidationError('Test error', zodIssues);
    expect(error.errors).toEqual(zodIssues);
  });
});

describe('validateWithSchema', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  it('should return validated data for valid input', () => {
    const valid = { name: 'John', age: 30 };
    const result = validateWithSchema(testSchema, valid);
    expect(result).toEqual(valid);
  });

  it('should throw ValidationError for invalid data', () => {
    const invalid = { name: '', age: -1 };
    expect(() => validateWithSchema(testSchema, invalid)).toThrow(ValidationError);
  });

  it('should include context in error message', () => {
    const invalid = { name: '', age: 30 };
    expect(() => validateWithSchema(testSchema, invalid, 'user profile')).toThrow(
      /Validation failed in user profile/,
    );
  });

  it('should include validation errors in thrown error', () => {
    const invalid = { name: '', age: 30 };
    try {
      validateWithSchema(testSchema, invalid);
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.errors.length).toBeGreaterThan(0);
      }
    }
  });

  it('should handle missing fields', () => {
    const invalid = { name: 'John' }; // Missing age field
    expect(() => validateWithSchema(testSchema, invalid)).toThrow(ValidationError);
  });

  it('should handle wrong types', () => {
    const invalid = { name: 'John', age: '30' }; // Age should be number
    expect(() => validateWithSchema(testSchema, invalid)).toThrow(ValidationError);
  });

  it('should log errors when validation fails', async () => {
    const { logger } = await import('../../src/utils/logger');
    const invalid = { name: '', age: 30 };

    try {
      validateWithSchema(testSchema, invalid, 'test context');
    } catch {
      // Expected to throw
    }

    expect(logger.error).toHaveBeenCalledWith(
      'Validation failed in test context',
      expect.objectContaining({
        errors: expect.any(Array),
        data: invalid,
      }),
    );
  });
});

describe('safeValidate', () => {
  const testSchema = z.object({
    email: z.string().email(),
  });

  it('should return success object for valid data', () => {
    const result = safeValidate(testSchema, { email: 'test@example.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should return error object for invalid data', () => {
    const result = safeValidate(testSchema, { email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should not throw errors', () => {
    expect(() => safeValidate(testSchema, { email: 'invalid' })).not.toThrow();
  });

  it('should handle missing fields gracefully', () => {
    const result = safeValidate(testSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should handle null input', () => {
    const result = safeValidate(testSchema, null);
    expect(result.success).toBe(false);
  });

  it('should handle undefined input', () => {
    const result = safeValidate(testSchema, undefined);
    expect(result.success).toBe(false);
  });

  it('should return detailed error information', () => {
    const result = safeValidate(testSchema, { email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.errors[0];
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('code');
    }
  });
});