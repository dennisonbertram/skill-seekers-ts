import TurndownService from 'turndown';
import type { Page, CodeSample } from '../../types/page';
import type { Config } from '../../types/config';
import { logger } from '../../utils/logger';
import { LanguageDetector } from '../../utils/language-detector';

export interface CategoryScore {
  category: string;
  score: number;
}

export class ContentProcessor {
  private turndownService: TurndownService;
  private languageDetector = new LanguageDetector();
  private moduleLogger = logger.child({ module: 'ContentProcessor' });

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }

  /**
   * Convert HTML content to Markdown
   */
  htmlToMarkdown(html: string): string {
    try {
      return this.turndownService.turndown(html);
    } catch (error) {
      this.moduleLogger.error('Failed to convert HTML to Markdown', { error });
      return html; // Return original HTML as fallback
    }
  }

  /**
   * Categorize a page based on URL and content scoring
   */
  categorizePage(page: Page, config: Config): string {
    if (!config.categories) {
      return 'uncategorized';
    }

    const scores: CategoryScore[] = [];

    for (const [category, keywords] of Object.entries(config.categories)) {
      const score = this.calculateCategoryScore(page, keywords);
      scores.push({ category, score });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Return highest scoring category if score > 0
    if (scores[0] && scores[0].score > 0) {
      return scores[0].category;
    }

    return 'uncategorized';
  }

  /**
   * Calculate category score based on keyword matches
   */
  private calculateCategoryScore(page: Page, keywords: string[]): number {
    let score = 0;
    const urlLower = page.url.toLowerCase();
    const titleLower = page.title.toLowerCase();
    const contentLower = page.content.toLowerCase();

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();

      // URL match (highest weight)
      if (urlLower.includes(keywordLower)) {
        score += 10;
      }

      // Title match (medium weight)
      if (titleLower.includes(keywordLower)) {
        score += 5;
      }

      // Content match (lower weight)
      if (contentLower.includes(keywordLower)) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Clean and enhance code samples
   */
  enhanceCodeSamples(samples: CodeSample[]): CodeSample[] {
    return samples.map((sample) => {
      // Clean code (remove excessive whitespace)
      const cleanedCode = this.cleanCode(sample.code);

      // Re-detect language if marked as plaintext
      let language = sample.language;
      if (language === 'plaintext' || language === 'text') {
        language = this.languageDetector.detectFromCode(cleanedCode);
      }

      return {
        ...sample,
        code: cleanedCode,
        language,
      };
    });
  }

  /**
   * Clean code by removing excessive whitespace
   */
  private cleanCode(code: string): string {
    // Remove trailing whitespace from each line
    const lines = code.split('\n').map((line) => line.trimEnd());

    // Remove leading empty lines
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }

    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }

    return lines.join('\n');
  }

  /**
   * Extract keywords from page content
   */
  extractKeywords(content: string, limit: number = 10): string[] {
    // Simple keyword extraction: get most common words
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3); // Only words > 3 chars

    // Count word frequency
    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }

    // Sort by frequency and return top N
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Process a page: convert to markdown, categorize, enhance code samples
   */
  processPage(page: Page, config: Config): Page {
    this.moduleLogger.debug('Processing page', { url: page.url });

    // Convert HTML to Markdown if not already present
    const markdown = page.markdown || this.htmlToMarkdown(page.content);

    // Categorize page
    const category = this.categorizePage(page, config);

    // Enhance code samples
    const codeSamples = this.enhanceCodeSamples(page.codeSamples);

    return {
      ...page,
      markdown,
      category,
      codeSamples,
    };
  }

  /**
   * Process multiple pages
   */
  processPages(pages: Page[], config: Config): Page[] {
    this.moduleLogger.info('Processing pages', { count: pages.length });
    return pages.map((page) => this.processPage(page, config));
  }
}