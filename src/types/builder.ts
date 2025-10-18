/**
 * Builder interface definitions for skill construction
 */

import { Page } from './page';

export interface IBuilder {
  build(pages: Page[]): Promise<BuildResult>;
}

export interface BuildResult {
  skillPath: string;
  categorizedPages: Map<string, Page[]>;
  referenceFiles: string[];
}