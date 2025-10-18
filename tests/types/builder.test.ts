import { describe, it, expect } from 'vitest';
// Import schema that doesn't exist yet - this will cause tests to fail (RED phase)
import { BuildResultSchema } from '../../src/types/builder';

describe('BuildResultSchema', () => {
  it('should validate a complete build result', () => {
    const validResult = {
      skillPath: '/path/to/skill',
      categorizedPages: new Map([
        ['tutorial', [
          {
            url: 'https://example.com/tutorial1',
            title: 'Tutorial 1',
            content: 'Tutorial content',
            codeSamples: [],
            links: [],
          },
        ]],
        ['reference', [
          {
            url: 'https://example.com/ref1',
            title: 'Reference 1',
            content: 'Reference content',
            codeSamples: [],
            links: [],
          },
        ]],
      ]),
      referenceFiles: ['file1.md', 'file2.md'],
    };
    const result = BuildResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('should reject empty skillPath', () => {
    const invalid = {
      skillPath: '',
      categorizedPages: new Map(),
      referenceFiles: [],
    };
    const result = BuildResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should provide default empty array for referenceFiles', () => {
    const minimal = {
      skillPath: '/path/to/skill',
      categorizedPages: new Map(),
    };
    const result = BuildResultSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referenceFiles).toEqual([]);
    }
  });

  it('should validate pages within categorizedPages Map', () => {
    const validResult = {
      skillPath: '/path/to/skill',
      categorizedPages: new Map([
        ['docs', [
          {
            url: 'https://example.com/doc',
            title: 'Doc Title',
            content: 'Doc content',
            markdown: '# Doc',
            codeSamples: [
              { language: 'python', code: 'print("test")' },
            ],
            links: ['https://example.com/link'],
            category: 'documentation',
          },
        ]],
      ]),
      referenceFiles: [],
    };
    const result = BuildResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('should handle empty categorizedPages Map', () => {
    const valid = {
      skillPath: '/path/to/skill',
      categorizedPages: new Map(),
      referenceFiles: [],
    };
    const result = BuildResultSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});