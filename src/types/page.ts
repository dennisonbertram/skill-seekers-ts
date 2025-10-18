/**
 * Page-related type definitions for scraped documentation content
 */

import { z } from 'zod';

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

// Zod schemas for runtime validation
export const CodeSampleSchema = z.object({
  language: z.string().min(1),
  code: z.string().min(1),
  context: z.string().optional(),
});

export const PageSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  content: z.string().min(1),
  markdown: z.string().optional(),
  codeSamples: z.array(CodeSampleSchema).default([]),
  links: z.array(z.string().url()).default([]),
  category: z.string().optional(),
});