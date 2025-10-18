import axios from 'axios';
import * as cheerio from 'cheerio';
import type { IScraper, ScraperOptions } from '../../types/scraper';
import type { Page, CodeSample } from '../../types/page';
import type { Config } from '../../types/config';
import { logger } from '../../utils/logger';
import { LanguageDetector } from '../../utils/language-detector';

type CheerioAPI = ReturnType<typeof cheerio.load>;

export class CheerioScraper implements IScraper {
  private config: Config;
  private visitedUrls: Set<string> = new Set();
  private pendingUrls: string[] = [];
  private languageDetector = new LanguageDetector();
  private moduleLogger = logger.child({ module: 'CheerioScraper' });

  constructor(options: ScraperOptions) {
    this.config = options.config;
  }

  async validateConnection(): Promise<boolean> {
    try {
      this.moduleLogger.info('Validating connection to base URL');
      const response = await axios.get(this.config.base_url, {
        timeout: 10000,
        headers: { 'User-Agent': 'skill-seekers-ts/2.0' },
      });
      return response.status === 200;
    } catch (error) {
      this.moduleLogger.error('Connection validation failed', { error });
      return false;
    }
  }

  async scrapeAll(): Promise<Page[]> {
    this.moduleLogger.info('Starting Cheerio crawl', {
      baseUrl: this.config.base_url,
      maxPages: this.config.max_pages,
    });

    const pages: Page[] = [];
    this.visitedUrls.clear();
    this.pendingUrls = [this.normalizeUrl(this.config.base_url)];

    while (this.pendingUrls.length > 0 && pages.length < this.config.max_pages) {
      const url = this.pendingUrls.shift()!;

      if (this.visitedUrls.has(url)) {
        continue;
      }

      try {
        const page = await this.scrapeSingle(url);
        pages.push(page);
        this.visitedUrls.add(url);

        // Add new links to pending queue
        const newLinks = this.filterLinks(page.links);
        this.pendingUrls.push(...newLinks);

        // Respect rate limit
        if (this.config.rate_limit > 0) {
          await this.delay(this.config.rate_limit * 1000);
        }
      } catch (error) {
        this.moduleLogger.warn('Failed to scrape page, skipping', { url, error });
      }
    }

    this.moduleLogger.info(`Crawled ${pages.length} pages`);
    return pages;
  }

  async scrapeSingle(url: string): Promise<Page> {
    this.moduleLogger.debug('Scraping single page', { url });

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'skill-seekers-ts/2.0' },
      });

      const html = response.data;
      const $: CheerioAPI = cheerio.load(html);

      // Extract content using configured selector
      const content = $(this.config.selectors.main_content).html() || '';
      const title = $(this.config.selectors.title).first().text().trim() || 'Untitled';

      // Extract code samples
      const codeSamples = this.extractCodeSamples($);

      // Extract links
      const links = this.extractLinks($, url);

      return {
        url,
        title,
        content,
        codeSamples,
        links,
      };
    } catch (error) {
      this.moduleLogger.error('Failed to scrape page', { url, error });
      throw error;
    }
  }

  private extractCodeSamples($: CheerioAPI): CodeSample[] {
    const samples: CodeSample[] = [];
    const codeBlocks = $(this.config.selectors.code_blocks);

    codeBlocks.each((_: number, element: cheerio.Element) => {
      const code = $(element).text().trim();
      if (code.length === 0) {
        return;
      }

      // Try to detect language from class attribute
      const classAttr = $(element).attr('class') || '';
      let language = this.detectLanguageFromClass(classAttr);

      // If no language from class, detect from code content
      if (language === 'plaintext') {
        language = this.languageDetector.detectFromCode(code);
      }

      samples.push({ language, code });
    });

    return samples;
  }

  private detectLanguageFromClass(classAttr: string): string {
    // Common patterns: language-python, lang-python, python, highlight-python
    const patterns = [
      /language-(\w+)/,
      /lang-(\w+)/,
      /highlight-(\w+)/,
      /\b(python|javascript|typescript|java|cpp|c|ruby|go|rust|gdscript)\b/,
    ];

    for (const pattern of patterns) {
      const match = classAttr.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return 'plaintext';
  }

  private extractLinks($: CheerioAPI, baseUrl: string): string[] {
    const links: string[] = [];
    $('a[href]').each((_: number, element: cheerio.Element) => {
      const href = $(element).attr('href');
      if (!href) {
        return;
      }

      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push(this.normalizeUrl(absoluteUrl));
      } catch {
        // Invalid URL, skip
      }
    });

    return links;
  }

  private filterLinks(links: string[]): string[] {
    const normalizedBaseUrl = this.normalizeUrl(this.config.base_url);
    return links.filter((link) => {
      // Must start with base URL (normalized)
      if (!link.startsWith(normalizedBaseUrl)) {
        return false;
      }

      // Check exclude patterns
      for (const pattern of this.config.url_patterns.exclude) {
        if (link.includes(pattern)) {
          return false;
        }
      }

      // If include patterns specified, must match one
      if (this.config.url_patterns.include.length > 0) {
        return this.config.url_patterns.include.some((pattern) => link.includes(pattern));
      }

      // Not already visited
      return !this.visitedUrls.has(link);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normalize URL by removing trailing slash for consistency
   */
  private normalizeUrl(url: string): string {
    return url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
  }
}
