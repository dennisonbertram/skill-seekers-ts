import { describe, it, expect, beforeEach } from 'vitest';
import { SkillMdGenerator } from '../../../src/core/builder/skillmd-generator';
import type { Config } from '../../../src/types/config';
import type { CategoryStats } from '../../../src/core/builder/categorizer';

describe('SkillMdGenerator', () => {
  let generator: SkillMdGenerator;

  const mockConfig: Config = {
    name: 'react-docs',
    description: 'Official React documentation',
    base_url: 'https://react.dev',
    selectors: {
      main_content: 'main',
      title: 'h1',
      code_blocks: 'pre code',
    },
    url_patterns: {
      include: [],
      exclude: [],
    },
    categories: {
      tutorial: ['tutorial', 'getting-started'],
      api: ['api', 'reference'],
    },
    rate_limit: 0.5,
    max_pages: 100,
  };

  const mockCategoryStats: CategoryStats[] = [
    {
      category: 'tutorial',
      pageCount: 10,
      totalCodeSamples: 25,
      averageContentLength: 1500,
    },
    {
      category: 'api',
      pageCount: 20,
      totalCodeSamples: 50,
      averageContentLength: 2000,
    },
  ];

  beforeEach(() => {
    generator = new SkillMdGenerator();
  });

  describe('generate', () => {
    it('should generate complete SKILL.md content', () => {
      const content = generator.generate({
        config: mockConfig,
        categoryStats: mockCategoryStats,
        totalPages: 30,
        referenceCount: 30,
      });

      expect(content).toContain('# React Docs Documentation Skill');
      expect(content).toContain('## Description');
      expect(content).toContain('## Documentation Statistics');
      expect(content).toContain('## How to Use This Skill');
      expect(content).toContain('## Documentation Categories');
      expect(content).toContain('## Tips for Best Results');
    });

    it('should include correct statistics', () => {
      const content = generator.generate({
        config: mockConfig,
        categoryStats: mockCategoryStats,
        totalPages: 30,
        referenceCount: 30,
      });

      expect(content).toContain('**Total Pages**: 30');
      expect(content).toContain('**Reference Files**: 30');
      expect(content).toContain('**Code Samples**: 75'); // 25 + 50
      expect(content).toContain('**Categories**: 2');
    });

    it('should work without categories', () => {
      const content = generator.generate({
        config: { ...mockConfig, categories: undefined },
        categoryStats: [],
        totalPages: 10,
        referenceCount: 10,
      });

      expect(content).toContain('# React Docs Documentation Skill');
      expect(content).not.toContain('## Documentation Categories');
    });
  });

  describe('generateHeader', () => {
    it('should format skill name correctly', () => {
      const header = (generator as any).generateHeader(mockConfig);

      expect(header).toContain('# React Docs Documentation Skill');
      expect(header).toContain('comprehensive skill');
    });

    it('should handle single-word names', () => {
      const config = { ...mockConfig, name: 'godot' };
      const header = (generator as any).generateHeader(config);

      expect(header).toContain('# Godot Documentation Skill');
    });

    it('should handle underscore-separated names', () => {
      const config = { ...mockConfig, name: 'my_framework' };
      const header = (generator as any).generateHeader(config);

      expect(header).toContain('# My Framework Documentation Skill');
    });
  });

  describe('generateDescription', () => {
    it('should use provided description', () => {
      const description = (generator as any).generateDescription(mockConfig);

      expect(description).toContain('## Description');
      expect(description).toContain('Official React documentation');
      expect(description).toContain('https://react.dev');
    });

    it('should generate default description if none provided', () => {
      const config = { ...mockConfig, description: undefined };
      const description = (generator as any).generateDescription(config);

      expect(description).toContain('comprehensive documentation');
      expect(description).toContain('React Docs');
    });
  });

  describe('generateStatistics', () => {
    it('should include all statistics', () => {
      const stats = (generator as any).generateStatistics({
        config: mockConfig,
        categoryStats: mockCategoryStats,
        totalPages: 30,
        referenceCount: 30,
      });

      expect(stats).toContain('## Documentation Statistics');
      expect(stats).toContain('**Total Pages**: 30');
      expect(stats).toContain('**Reference Files**: 30');
      expect(stats).toContain('**Code Samples**: 75');
      expect(stats).toContain('**Categories**: 2');
    });

    it('should work without category stats', () => {
      const stats = (generator as any).generateStatistics({
        config: mockConfig,
        categoryStats: [],
        totalPages: 10,
        referenceCount: 10,
      });

      expect(stats).toContain('**Total Pages**: 10');
      expect(stats).not.toContain('**Code Samples**');
    });
  });

  describe('generateUsageInstructions', () => {
    it('should include usage guidelines', () => {
      const instructions = (generator as any).generateUsageInstructions(mockConfig);

      expect(instructions).toContain('## How to Use This Skill');
      expect(instructions).toContain('Ask specific questions');
      expect(instructions).toContain('Request code examples');
      expect(instructions).toContain('### Example Prompts');
    });

    it('should include framework-specific examples for React', () => {
      const instructions = (generator as any).generateUsageInstructions(mockConfig);

      expect(instructions).toContain('create a custom hook');
      expect(instructions).toContain('state management');
      expect(instructions).toContain('useEffect hook');
    });

    it('should include generic examples for unknown frameworks', () => {
      const config = { ...mockConfig, name: 'unknown-framework' };
      const instructions = (generator as any).generateUsageInstructions(config);

      expect(instructions).toContain('get started with a basic example');
      expect(instructions).toContain('core concepts');
    });
  });

  describe('generateCategoryOverview', () => {
    it('should list all categories with stats', () => {
      const overview = (generator as any).generateCategoryOverview(mockCategoryStats);

      expect(overview).toContain('## Documentation Categories');
      expect(overview).toContain('### Tutorial');
      expect(overview).toContain('**Pages**: 10');
      expect(overview).toContain('**Code Samples**: 25');
      expect(overview).toContain('### Api');
      expect(overview).toContain('**Pages**: 20');
      expect(overview).toContain('**Code Samples**: 50');
    });

    it('should format "uncategorized" as "Other Documentation"', () => {
      const stats: CategoryStats[] = [
        {
          category: 'uncategorized',
          pageCount: 5,
          totalCodeSamples: 10,
          averageContentLength: 1000,
        },
      ];

      const overview = (generator as any).generateCategoryOverview(stats);

      expect(overview).toContain('### Other Documentation');
    });
  });

  describe('generateTips', () => {
    it('should include helpful tips', () => {
      const tips = (generator as any).generateTips(mockConfig);

      expect(tips).toContain('## Tips for Best Results');
      expect(tips).toContain('Be specific');
      expect(tips).toContain('Reference versions');
      expect(tips).toContain('Ask for explanations');
      expect(tips).toContain('Combine topics');
    });
  });

  describe('formatName', () => {
    it('should convert hyphen-separated to title case', () => {
      const formatted = (generator as any).formatName('react-native');
      expect(formatted).toBe('React Native');
    });

    it('should convert underscore-separated to title case', () => {
      const formatted = (generator as any).formatName('my_framework');
      expect(formatted).toBe('My Framework');
    });

    it('should handle single words', () => {
      const formatted = (generator as any).formatName('godot');
      expect(formatted).toBe('Godot');
    });
  });

  describe('formatCategoryName', () => {
    it('should format regular categories', () => {
      const formatted = (generator as any).formatCategoryName('getting-started');
      expect(formatted).toBe('Getting Started');
    });

    it('should format "uncategorized" specially', () => {
      const formatted = (generator as any).formatCategoryName('uncategorized');
      expect(formatted).toBe('Other Documentation');
    });
  });
});
