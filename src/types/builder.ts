/**
 * Builder interface definitions for skill construction
 */

import { z } from 'zod';
import { Page, PageSchema } from './page';

export interface IBuilder {
  build(pages: Page[]): Promise<BuildResult>;
}

export interface BuildResult {
  skillPath: string;
  categorizedPages: Map<string, Page[]>;
  referenceFiles: string[];
}

// Zod schema for BuildResult
export const BuildResultSchema = z.object({
  skillPath: z.string().min(1),
  categorizedPages: z.map(z.string(), z.array(PageSchema)),
  referenceFiles: z.array(z.string()).default([]),
});