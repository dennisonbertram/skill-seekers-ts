import type { Config } from '../../types/config';
import type { CategoryStats } from './categorizer';
import { logger } from '../../utils/logger';

export interface SkillMdOptions {
  config: Config;
  categoryStats: CategoryStats[];
  totalPages: number;
  referenceCount: number;
}

export class SkillMdGenerator {
  private moduleLogger = logger.child({ module: 'SkillMdGenerator' });

  /**
   * Generate SKILL.md content
   */
  generate(options: SkillMdOptions): string {
    this.moduleLogger.info('Generating SKILL.md');

    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(options.config));
    sections.push('');

    // Description
    sections.push(this.generateDescription(options.config));
    sections.push('');

    // Statistics
    sections.push(this.generateStatistics(options));
    sections.push('');

    // Usage Instructions
    sections.push(this.generateUsageInstructions(options.config));
    sections.push('');

    // Category Overview
    if (options.categoryStats.length > 0) {
      sections.push(this.generateCategoryOverview(options.categoryStats));
      sections.push('');
    }

    // Tips
    sections.push(this.generateTips(options.config));

    return sections.join('\n');
  }

  /**
   * Generate header section
   */
  private generateHeader(config: Config): string {
    const name = this.formatName(config.name);
    return `# ${name} Documentation Skill\n\nA comprehensive skill for ${name} documentation and code examples.`;
  }

  /**
   * Generate description section
   */
  private generateDescription(config: Config): string {
    const sections: string[] = [];

    sections.push('## Description\n');
    sections.push(
      config.description ||
        `This skill provides comprehensive documentation and code examples for ${this.formatName(config.name)}.`,
    );
    sections.push('');
    sections.push(
      `The documentation is sourced from the official ${this.formatName(config.name)} documentation at ${config.base_url}.`,
    );

    return sections.join('\n');
  }

  /**
   * Generate statistics section
   */
  private generateStatistics(options: SkillMdOptions): string {
    const sections: string[] = [];

    sections.push('## Documentation Statistics\n');
    sections.push(`- **Total Pages**: ${options.totalPages}`);
    sections.push(`- **Reference Files**: ${options.referenceCount}`);

    if (options.categoryStats.length > 0) {
      const totalCodeSamples = options.categoryStats.reduce(
        (sum, stat) => sum + stat.totalCodeSamples,
        0,
      );
      sections.push(`- **Code Samples**: ${totalCodeSamples}`);
      sections.push(`- **Categories**: ${options.categoryStats.length}`);
    }

    return sections.join('\n');
  }

  /**
   * Generate usage instructions
   */
  private generateUsageInstructions(config: Config): string {
    const name = this.formatName(config.name);

    const sections: string[] = [];

    sections.push('## How to Use This Skill\n');
    sections.push('This skill works best when you:');
    sections.push('');
    sections.push(`1. **Ask specific questions** about ${name} features or concepts`);
    sections.push(`2. **Request code examples** for specific use cases`);
    sections.push(`3. **Seek best practices** for ${name} development`);
    sections.push(`4. **Explore API references** for detailed method documentation`);
    sections.push('');
    sections.push('### Example Prompts\n');
    sections.push(`- "Show me how to ${this.generateExampleTask(config)}"`);
    sections.push(`- "What's the best way to ${this.generateExampleTask(config)}?"`);
    sections.push(`- "Explain ${name}'s approach to ${this.generateExampleConcept(config)}"`);
    sections.push(`- "Give me a code example for ${this.generateExampleFeature(config)}"`);

    return sections.join('\n');
  }

  /**
   * Generate category overview
   */
  private generateCategoryOverview(stats: CategoryStats[]): string {
    const sections: string[] = [];

    sections.push('## Documentation Categories\n');

    for (const stat of stats) {
      const categoryName = this.formatCategoryName(stat.category);
      sections.push(`### ${categoryName}\n`);
      sections.push(`- **Pages**: ${stat.pageCount}`);
      sections.push(`- **Code Samples**: ${stat.totalCodeSamples}`);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate tips section
   */
  private generateTips(config: Config): string {
    const name = this.formatName(config.name);

    const sections: string[] = [];

    sections.push('## Tips for Best Results\n');
    sections.push(`- **Be specific**: Instead of "${name} tutorial", ask "${name} getting started guide"`);
    sections.push('- **Reference versions**: Mention version numbers when relevant');
    sections.push('- **Ask for explanations**: Request clarifications of complex concepts');
    sections.push('- **Combine topics**: Ask about integrations between different features');

    return sections.join('\n');
  }

  /**
   * Format skill name for display
   */
  private formatName(name: string): string {
    // Convert hyphen/underscore separated to title case
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: string): string {
    if (category === 'uncategorized') {
      return 'Other Documentation';
    }
    return this.formatName(category);
  }

  /**
   * Generate example task based on config
   */
  private generateExampleTask(config: Config): string {
    const frameworkKey = this.detectFramework(config.name);

    // Common patterns based on framework/library type
    const taskExamples: Record<string, string> = {
      react: 'create a custom hook',
      vue: 'set up a component with props',
      django: 'create a model with relationships',
      fastapi: 'define an API endpoint',
      godot: 'create a scene with a script',
      nextjs: 'set up server-side rendering',
    };

    return taskExamples[frameworkKey] || 'get started with a basic example';
  }

  /**
   * Generate example concept based on config
   */
  private generateExampleConcept(config: Config): string {
    const frameworkKey = this.detectFramework(config.name);

    const conceptExamples: Record<string, string> = {
      react: 'state management',
      vue: 'reactivity',
      django: 'ORM queries',
      fastapi: 'dependency injection',
      godot: 'scene organization',
      nextjs: 'routing',
    };

    return conceptExamples[frameworkKey] || 'core concepts';
  }

  /**
   * Generate example feature based on config
   */
  private generateExampleFeature(config: Config): string {
    const frameworkKey = this.detectFramework(config.name);

    const featureExamples: Record<string, string> = {
      react: 'useEffect hook',
      vue: 'computed properties',
      django: 'form validation',
      fastapi: 'async endpoints',
      godot: 'signals and nodes',
      nextjs: 'dynamic routes',
    };

    return featureExamples[frameworkKey] || 'common features';
  }

  /**
   * Detect framework from config name
   * Handles names like "react", "react-docs", "react_docs", etc.
   */
  private detectFramework(name: string): string {
    const normalized = name.toLowerCase();

    // List of known frameworks to detect
    const frameworks = [
      'react',
      'vue',
      'django',
      'fastapi',
      'godot',
      'nextjs',
    ];

    // Find framework that appears in the name
    for (const framework of frameworks) {
      if (normalized.includes(framework)) {
        return framework;
      }
    }

    // No known framework found
    return normalized;
  }
}
