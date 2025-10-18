/**
 * Scraper interface definitions for documentation extraction
 */

import { Page } from './page';
import { Config } from './config';

export interface IScraper {
  scrapeAll(): Promise<Page[]>;
  scrapeSingle(url: string): Promise<Page>;
  validateConnection(): Promise<boolean>;
}

export interface ScraperOptions {
  config: Config;
  apiKey?: string;
}