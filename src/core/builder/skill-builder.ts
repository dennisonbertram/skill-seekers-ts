import * as path from 'path';
import type { Page } from '../../types/page';
import type { Config } from '../../types/config';
import { Categorizer, type CategorizedPages } from './categorizer';
import { ReferenceGenerator } from './reference-generator';
import { SkillMdGenerator } from './skillmd-generator';
import { writeFile, ensureDir } from '../../utils/fs';
import { logger } from '../../utils/logger';

export interface BuildResult {
  skillPath: string;
  categorizedPages: CategorizedPages;
  referenceFiles: string[];
  skillMdPath: string;
}

export class SkillBuilder {
  private categorizer: Categorizer;
  private referenceGenerator: ReferenceGenerator;
  private skillMdGenerator: SkillMdGenerator;
  private moduleLogger = logger.child({ module: 'SkillBuilder' });

  constructor() {
    this.categorizer = new Categorizer();
    this.referenceGenerator = new ReferenceGenerator();
    this.skillMdGenerator = new SkillMdGenerator();
  }

  /**
   * Build complete skill from pages
   */
  async build(pages: Page[], config: Config, outputDir?: string): Promise<BuildResult> {
    const skillDir = outputDir || path.join(process.cwd(), 'output', config.name);

    this.moduleLogger.info('Building skill', {
      skillName: config.name,
      pageCount: pages.length,
      outputDir: skillDir,
    });

    // Ensure output directory exists
    await ensureDir(skillDir);

    // Step 1: Categorize pages
    const categorizedPages = this.categorizer.categorizePage(pages, config);

    // Validate categorization
    const isValid = this.categorizer.validateCategorization(categorizedPages, pages);
    if (!isValid) {
      throw new Error('Categorization validation failed: page count mismatch');
    }

    // Step 2: Generate references for each category
    const allReferenceFiles: string[] = [];

    for (const category of this.categorizer.getNonEmptyCategories(categorizedPages)) {
      const categoryPages = this.categorizer.getCategoryPages(categorizedPages, category);

      const referenceFiles = await this.referenceGenerator.generateReferences(
        categoryPages,
        skillDir,
        category,
      );

      // Generate index for this category
      await this.referenceGenerator.generateIndex(referenceFiles, skillDir, category);

      allReferenceFiles.push(...referenceFiles.map((rf) => rf.path));
    }

    // Step 3: Generate SKILL.md
    const skillMdContent = this.skillMdGenerator.generate({
      config,
      categoryStats: categorizedPages.stats,
      totalPages: pages.length,
      referenceCount: allReferenceFiles.length,
    });

    const skillMdPath = path.join(skillDir, 'SKILL.md');
    await writeFile(skillMdPath, skillMdContent);

    this.moduleLogger.info('Skill build complete', {
      skillPath: skillDir,
      categories: categorizedPages.stats.length,
      referenceFiles: allReferenceFiles.length,
    });

    return {
      skillPath: skillDir,
      categorizedPages,
      referenceFiles: allReferenceFiles,
      skillMdPath,
    };
  }

  /**
   * Build skill with processed pages
   */
  async buildFromProcessed(
    processedPages: Page[],
    config: Config,
    outputDir?: string,
  ): Promise<BuildResult> {
    return this.build(processedPages, config, outputDir);
  }
}
