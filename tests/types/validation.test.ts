import { describe, it, expect } from 'vitest';
import { SelectorsSchema, UrlPatternsSchema, CategoriesSchema } from '../../src/types/config';

describe('Sub-schema validation', () => {
  describe('SelectorsSchema', () => {
    it('should validate valid selectors', () => {
      const validSelectors = {
        main_content: 'div.content',
        title: 'h1.title',
        code_blocks: 'pre code',
      };

      const result = SelectorsSchema.safeParse(validSelectors);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete selectors', () => {
      const incompleteSelectors = {
        main_content: 'div.content',
        title: 'h1.title',
        // missing code_blocks
      };

      const result = SelectorsSchema.safeParse(incompleteSelectors);
      expect(result.success).toBe(false);
    });
  });

  describe('UrlPatternsSchema', () => {
    it('should apply default values when not provided', () => {
      const result = UrlPatternsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual([]);
        expect(result.data.exclude).toEqual([]);
      }
    });

    it('should accept custom patterns', () => {
      const patterns = {
        include: ['/docs/*', '/api/*'],
        exclude: ['/search', '/admin'],
      };

      const result = UrlPatternsSchema.safeParse(patterns);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual(['/docs/*', '/api/*']);
        expect(result.data.exclude).toEqual(['/search', '/admin']);
      }
    });
  });

  describe('CategoriesSchema', () => {
    it('should validate category mappings', () => {
      const categories = {
        'Getting Started': ['intro', 'quickstart'],
        'API': ['endpoints', 'authentication'],
      };

      const result = CategoriesSchema.safeParse(categories);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['Getting Started']).toEqual(['intro', 'quickstart']);
        expect(result.data['API']).toEqual(['endpoints', 'authentication']);
      }
    });

    it('should accept empty category arrays', () => {
      const categories = {
        'Empty Category': [],
      };

      const result = CategoriesSchema.safeParse(categories);
      expect(result.success).toBe(true);
    });
  });
});