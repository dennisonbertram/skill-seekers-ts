/**
 * Page-related type definitions for scraped documentation content
 */

export interface CodeSample {
  language: string;
  code: string;
  context?: string;
}

export interface Page {
  url: string;
  title: string;
  content: string;
  markdown?: string;
  codeSamples: CodeSample[];
  links: string[];
  category?: string;
}