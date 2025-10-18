import { describe, it, expect } from 'vitest';
// Import schemas that don't exist yet - this will cause tests to fail (RED phase)
import { PageSchema, CodeSampleSchema } from '../../src/types/page';

describe('CodeSampleSchema', () => {
  it('should validate a correct code sample', () => {
    const validSample = {
      language: 'python',
      code: 'import sys',
      context: 'Example import',
    };
    const result = CodeSampleSchema.safeParse(validSample);
    expect(result.success).toBe(true);
  });

  it('should reject code sample with empty language', () => {
    const invalid = { language: '', code: 'test' };
    const result = CodeSampleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject code sample with empty code', () => {
    const invalid = { language: 'python', code: '' };
    const result = CodeSampleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should allow optional context', () => {
    const valid = { language: 'javascript', code: 'const x = 5;' };
    const result = CodeSampleSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.context).toBeUndefined();
    }
  });
});

describe('PageSchema', () => {
  it('should validate a complete page', () => {
    const validPage = {
      url: 'https://example.com/page',
      title: 'Test Page',
      content: 'Test content',
      markdown: '# Test',
      codeSamples: [
        { language: 'python', code: 'print("hello")' },
      ],
      links: ['https://example.com/link'],
      category: 'tutorial',
    };
    const result = PageSchema.safeParse(validPage);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const invalid = {
      url: 'not-a-url',
      title: 'Test',
      content: 'Test',
    };
    const result = PageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should apply default empty arrays', () => {
    const minimal = {
      url: 'https://example.com',
      title: 'Test',
      content: 'Content',
    };
    const result = PageSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codeSamples).toEqual([]);
      expect(result.data.links).toEqual([]);
    }
  });

  it('should reject invalid link URLs in array', () => {
    const invalid = {
      url: 'https://example.com',
      title: 'Test',
      content: 'Content',
      links: ['not-a-url'],
    };
    const result = PageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const invalid = {
      url: 'https://example.com',
      title: '',
      content: 'Content',
    };
    const result = PageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject empty content', () => {
    const invalid = {
      url: 'https://example.com',
      title: 'Title',
      content: '',
    };
    const result = PageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate nested code samples', () => {
    const valid = {
      url: 'https://example.com',
      title: 'Test',
      content: 'Content',
      codeSamples: [
        { language: 'python', code: 'print("test")' },
        { language: 'javascript', code: 'console.log("test")', context: 'JS example' },
      ],
    };
    const result = PageSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codeSamples).toHaveLength(2);
    }
  });
});