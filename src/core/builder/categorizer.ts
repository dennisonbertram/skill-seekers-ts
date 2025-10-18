import type { Page } from '../../types/page';
import type { Config } from '../../types/config';
import { logger } from '../../utils/logger';
import { ContentProcessor } from '../processor/content-processor';

export interface CategoryStats {
  category: string;
  pageCount: number;
  totalCodeSamples: number;
  averageContentLength: number;
}

export interface CategorizedPages {
  categories: Map<string, Page[]>;
  uncategorized: Page[];
  stats: CategoryStats[];
}

export class Categorizer {
  private contentProcessor: ContentProcessor;
  private moduleLogger = logger.child({ module: 'Categorizer' });

  constructor() {
    this.contentProcessor = new ContentProcessor();
  }

  /**
   * Categorize an array of pages based on config categories
   */
  categorizePage(pages: Page[], config: Config): CategorizedPages {
    this.moduleLogger.info('Categorizing pages', { count: pages.length });

    const categories = new Map<string, Page[]>();
    const uncategorized: Page[] = [];

    // Initialize category buckets
    if (config.categories) {
      for (const category of Object.keys(config.categories)) {
        categories.set(category, []);
      }
    }

    // Categorize each page
    for (const page of pages) {
      const category = page.category || this.contentProcessor.categorizePage(page, config);

      if (category === 'uncategorized') {
        uncategorized.push(page);
      } else {
        const categoryPages = categories.get(category) || [];
        categoryPages.push(page);
        categories.set(category, categoryPages);
      }
    }

    // Calculate statistics
    const stats = this.calculateStats(categories, uncategorized);

    this.moduleLogger.info('Categorization complete', {
      totalCategories: categories.size,
      uncategorizedCount: uncategorized.length,
    });

    return { categories, uncategorized, stats };
  }

  /**
   * Calculate statistics for each category
   */
  private calculateStats(
    categories: Map<string, Page[]>,
    uncategorized: Page[],
  ): CategoryStats[] {
    const stats: CategoryStats[] = [];

    // Stats for each category
    for (const [category, pages] of categories.entries()) {
      if (pages.length === 0) continue;

      const totalCodeSamples = pages.reduce((sum, p) => sum + p.codeSamples.length, 0);
      const totalContentLength = pages.reduce((sum, p) => sum + p.content.length, 0);

      stats.push({
        category,
        pageCount: pages.length,
        totalCodeSamples,
        averageContentLength: Math.round(totalContentLength / pages.length),
      });
    }

    // Stats for uncategorized
    if (uncategorized.length > 0) {
      const totalCodeSamples = uncategorized.reduce((sum, p) => sum + p.codeSamples.length, 0);
      const totalContentLength = uncategorized.reduce((sum, p) => sum + p.content.length, 0);

      stats.push({
        category: 'uncategorized',
        pageCount: uncategorized.length,
        totalCodeSamples,
        averageContentLength: Math.round(totalContentLength / uncategorized.length),
      });
    }

    // Sort by page count descending
    stats.sort((a, b) => b.pageCount - a.pageCount);

    return stats;
  }

  /**
   * Get pages for a specific category
   */
  getCategoryPages(result: CategorizedPages, category: string): Page[] {
    if (category === 'uncategorized') {
      return result.uncategorized;
    }
    return result.categories.get(category) || [];
  }

  /**
   * Get all categories that have pages
   */
  getNonEmptyCategories(result: CategorizedPages): string[] {
    const categories: string[] = [];

    for (const [category, pages] of result.categories.entries()) {
      if (pages.length > 0) {
        categories.push(category);
      }
    }

    if (result.uncategorized.length > 0) {
      categories.push('uncategorized');
    }

    return categories.sort();
  }

  /**
   * Validate categorization result
   */
  validateCategorization(result: CategorizedPages, originalPages: Page[]): boolean {
    // Count total pages in result
    let totalCategorized = result.uncategorized.length;
    for (const pages of result.categories.values()) {
      totalCategorized += pages.length;
    }

    // Should match original page count
    if (totalCategorized !== originalPages.length) {
      this.moduleLogger.error('Page count mismatch after categorization', {
        original: originalPages.length,
        categorized: totalCategorized,
      });
      return false;
    }

    return true;
  }
}
