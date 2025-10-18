/**
 * Category statistics interface for SKILL.md generation
 */

export interface CategoryStats {
  category: string;
  pageCount: number;
  totalCodeSamples: number;
  averageContentLength: number;
}
