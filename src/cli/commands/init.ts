/**
 * Init command - Generate a config template
 */

import type { Config } from '../../types/config';
import { writeJsonFile, exists } from '../../utils/fs';
import * as path from 'path';

/**
 * Options for init command
 */
export interface InitOptions {
  /** Skill name */
  name: string;
  /** Base URL to scrape */
  url: string;
  /** Output file path (default: ./skill-config.json) */
  output?: string;
  /** Overwrite existing file */
  overwrite?: boolean;
  /** Include helpful description */
  includeComments?: boolean;
  /** Custom description */
  description?: string;
}

/**
 * Execute init command
 * Creates a config template file with default values
 */
export async function initCommand(options: InitOptions): Promise<void> {
  // Validate inputs
  if (!options.name || options.name.trim() === '') {
    throw new Error('Skill name cannot be empty');
  }

  // Validate URL format
  try {
    new URL(options.url);
  } catch {
    throw new Error(`Invalid URL: ${options.url}`);
  }

  // Determine output path
  const outputPath = options.output || path.join(process.cwd(), 'skill-config.json');

  // Check if file exists
  if (!options.overwrite && (await exists(outputPath))) {
    throw new Error(`Config file already exists: ${outputPath}`);
  }

  // Create config template
  const config: Config = {
    name: options.name,
    description: options.description || (options.includeComments
      ? `Configuration for ${options.name} skill`
      : undefined),
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
    categories: {},
    rate_limit: 0.5,
    max_pages: 500,
  };

  // Write config file
  await writeJsonFile(outputPath, config);
}
