/**
 * Configuration type definitions and validation schemas for skill-seekers
 */

import { z } from 'zod';

// Sub-schemas for better organization and reusability
export const SelectorsSchema = z.object({
  main_content: z.string(),
  title: z.string(),
  code_blocks: z.string(),
});

export const UrlPatternsSchema = z.object({
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
}).default({ include: [], exclude: [] });

export const CategoriesSchema = z.record(z.array(z.string()));

// Main configuration schema
export const ConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  base_url: z.string().url(),
  selectors: SelectorsSchema,
  url_patterns: UrlPatternsSchema,
  categories: CategoriesSchema.optional(),
  rate_limit: z.number().min(0).default(0.5),
  max_pages: z.number().min(1).default(500),
});

// Export types inferred from schemas
export type Config = z.infer<typeof ConfigSchema>;
export type Selectors = z.infer<typeof SelectorsSchema>;
export type UrlPatterns = z.infer<typeof UrlPatternsSchema>;
export type Categories = z.infer<typeof CategoriesSchema>;