/**
 * Build command - Main command for building skills
 */

import type { Config, Categories } from '../../types/config';
import type { Page } from '../../types/page';
import { loadConfig } from '../utils/config-loader';
import { ScraperFactory, ScraperType } from '../../core/scraper/factory';
import { ContentProcessor } from '../../core/processor/content-processor';
import { SkillBuilder } from '../../core/builder/skill-builder';
import * as path from 'path';

/**
 * Options for build command
 */
export interface BuildCommandOptions {
  /** Base URL to scrape */
  url?: string;
  /** Skill name */
  name?: string;
  /** Path to config file */
  config?: string;
  /** Output directory */
  output?: string;
  /** Maximum pages to scrape */
  maxPages?: number;
  /** Delay between requests (seconds) */
  rateLimit?: number;
  /** Firecrawl API key */
  firecrawlKey?: string;
  /** Disable Firecrawl, use only Cheerio */
  noFirecrawl?: boolean;
  /** Categories as JSON string */
  categories?: string;
}

/**
 * Merge command options with config file
 * Command-line flags override config file values
 */
function mergeConfigWithOptions(config: Config, options: BuildCommandOptions): Config {
  const merged: Config = { ...config };

  // Override with command-line flags if provided
  if (options.name) merged.name = options.name;
  if (options.url) merged.base_url = options.url;
  if (options.maxPages !== undefined) merged.max_pages = options.maxPages;
  if (options.rateLimit !== undefined) merged.rate_limit = options.rateLimit;
  if (options.categories) {
    try {
      merged.categories = JSON.parse(options.categories) as Categories;
    } catch (error) {
      throw new Error(`Invalid categories JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return merged;
}

/**
 * Create config from command-line options only
 */
function createConfigFromOptions(options: BuildCommandOptions): Config {
  if (!options.name) {
    throw new Error('--name is required when not using --config');
  }
  if (!options.url) {
    throw new Error('--url is required when not using --config');
  }

  // Parse categories if provided
  let categories: Categories | undefined;
  if (options.categories) {
    try {
      categories = JSON.parse(options.categories) as Categories;
    } catch (error) {
      throw new Error(`Invalid categories JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    name: options.name,
    base_url: options.url,
    selectors: {
      main_content: 'main',
      title: 'h1',
      code_blocks: 'pre code',
    },
    url_patterns: {
      include: [],
      exclude: [],
    },
    categories: categories || {},
    rate_limit: options.rateLimit ?? 0.5,
    max_pages: options.maxPages ?? 500,
  };
}

/**
 * Execute build command
 * Orchestrates scraping, processing, and building a skill
 */
export async function buildCommand(options: BuildCommandOptions): Promise<void> {
  // Validate inputs
  if (!options.config) {
    if (!options.name && !options.url) {
      throw new Error('Either --config or both --name and --url are required');
    }
    if (!options.name) {
      throw new Error('--name is required when not using --config');
    }
    if (!options.url) {
      throw new Error('--url is required when not using --config');
    }
  }

  // Validate max pages
  if (options.maxPages !== undefined && options.maxPages <= 0) {
    throw new Error('--max-pages must be greater than 0');
  }

  // Load or create config
  let config: Config;
  if (options.config) {
    const loadedConfig = await loadConfig(options.config);
    config = mergeConfigWithOptions(loadedConfig, options);
  } else {
    config = createConfigFromOptions(options);
  }

  // Determine output directory
  const outputDir = options.output || path.join(process.cwd(), 'output', config.name);

  // Determine scraper type
  let scraperType: ScraperType;
  let apiKey: string | undefined;

  if (options.noFirecrawl) {
    scraperType = 'cheerio';
  } else {
    // Use Firecrawl if API key available
    apiKey = options.firecrawlKey || process.env.FIRECRAWL_API_KEY;
    scraperType = apiKey ? 'hybrid' : 'cheerio';
  }

  // Create scraper
  const scraper = ScraperFactory.create({
    type: scraperType,
    config: config,
    apiKey,
  });

  // Scrape pages
  const pages = await scraper.scrapeAll();

  if (pages.length === 0) {
    throw new Error('No pages were scraped. Check your URL and selectors.');
  }

  // Process pages
  const processor = new ContentProcessor();
  const processedPages = pages.map((page: Page) => ({
    ...page,
    markdown: processor.htmlToMarkdown(page.content),
  }));

  // Build skill
  const builder = new SkillBuilder();
  await builder.build(processedPages, config, outputDir);
}
