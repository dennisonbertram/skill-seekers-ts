import Firecrawl from '@mendable/firecrawl-js';
import type { IScraper, ScraperOptions } from '../../types/scraper';
import type { Page, CodeSample } from '../../types/page';
import type { Config } from '../../types/config';
import { logger } from '../../utils/logger';

export class FirecrawlScraper implements IScraper {
  private firecrawl: Firecrawl;
  private config: Config;
  private moduleLogger = logger.child({ module: 'FirecrawlScraper' });

  constructor(options: ScraperOptions) {
    if (!options.apiKey) {
      throw new Error('Firecrawl API key is required');
    }
    this.firecrawl = new Firecrawl({ apiKey: options.apiKey });
    this.config = options.config;
  }

  async validateConnection(): Promise<boolean> {
    try {
      this.moduleLogger.info('Validating Firecrawl connection');
      // Test with a simple scrape of the base URL
      const result = await this.firecrawl.scrapeUrl(this.config.base_url, {
        formats: ['markdown'],
      });
      return result.success === true;
    } catch (error) {
      this.moduleLogger.error('Firecrawl connection validation failed', { error });
      return false;
    }
  }

  async scrapeAll(): Promise<Page[]> {
    this.moduleLogger.info('Starting Firecrawl crawl', {
      baseUrl: this.config.base_url,
      maxPages: this.config.max_pages,
      includePaths: this.config.url_patterns.include,
      excludePaths: this.config.url_patterns.exclude,
    });

    try {
      // Use crawlUrl with pollInterval - this waits for the async job to complete
      // The pollInterval is the THIRD parameter (not in params object)
      const crawlResult = await this.firecrawl.crawlUrl(
        this.config.base_url,
        {
          limit: this.config.max_pages,
          // Note: maxDepth removed - causes "URL depth exceeds maxDepth" errors with some sites
          includePaths: this.config.url_patterns.include,
          excludePaths: this.config.url_patterns.exclude,
          scrapeOptions: {
            formats: ['markdown', 'html', 'links'],
          },
        },
        2 // Poll every 2 seconds for job completion
      );

      if (!crawlResult.success || !crawlResult.data) {
        throw new Error('Firecrawl crawl failed');
      }

      this.moduleLogger.info(`Crawl completed`, {
        totalPages: crawlResult.data.length,
        status: crawlResult.status,
        completed: crawlResult.completed,
        total: crawlResult.total,
        creditsUsed: crawlResult.creditsUsed,
      });

      return crawlResult.data.map((item: any) => this.transformToPage(item));
    } catch (error) {
      this.moduleLogger.error('Firecrawl scrapeAll failed', { error });
      throw error;
    }
  }

  async scrapeSingle(url: string): Promise<Page> {
    this.moduleLogger.debug('Scraping single page', { url });

    try {
      const result = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html', 'links'],
      });

      if (!result.success) {
        throw new Error(`Failed to scrape ${url}`);
      }

      return this.transformToPage(result);
    } catch (error) {
      this.moduleLogger.error('Firecrawl scrapeSingle failed', { url, error });
      throw error;
    }
  }

  private transformToPage(data: any): Page {
    const codeSamples = this.extractCodeSamples(data.markdown || '');

    // Get URL from either top-level (scrape API) or metadata (crawl API)
    const url = data.url || data.metadata?.url || data.metadata?.sourceURL;

    // Validate URL exists and is valid
    if (!url || typeof url !== 'string') {
      this.moduleLogger.warn('Firecrawl returned data without valid URL', {
        hasTopLevelUrl: !!data.url,
        hasMetadataUrl: !!data.metadata?.url,
        hasMetadataSourceURL: !!data.metadata?.sourceURL,
        title: data.metadata?.title,
        hasMarkdown: !!data.markdown,
      });
      throw new Error(
        `Firecrawl returned invalid page data: missing or invalid URL. ` +
        `Title: ${data.metadata?.title || 'unknown'}, ` +
        `Has content: ${!!data.markdown}`
      );
    }

    // Validate URL is well-formed
    try {
      new URL(url);
    } catch (error) {
      this.moduleLogger.warn('Firecrawl returned malformed URL', {
        url,
        title: data.metadata?.title,
      });
      throw new Error(
        `Firecrawl returned malformed URL: "${url}". ` +
        `Title: ${data.metadata?.title || 'unknown'}`
      );
    }

    return {
      url,
      title: data.metadata?.title || this.extractTitleFromMarkdown(data.markdown || ''),
      content: data.html || '',
      markdown: data.markdown,
      codeSamples,
      links: data.links || [],
    };
  }

  private extractCodeSamples(markdown: string): CodeSample[] {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const samples: CodeSample[] = [];
    let match;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2].trim();

      if (code.length > 0) {
        samples.push({
          language,
          code,
        });
      }
    }

    return samples;
  }

  private extractTitleFromMarkdown(markdown: string): string {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'Untitled';
  }
}