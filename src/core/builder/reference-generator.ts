import * as path from 'path';
import type { Page } from '../../types/page';
import { writeFile, ensureDir } from '../../utils/fs';
import { logger } from '../../utils/logger';

export interface ReferenceFile {
  filename: string;
  path: string;
  page: Page;
}

export class ReferenceGenerator {
  private moduleLogger = logger.child({ module: 'ReferenceGenerator' });

  /**
   * Generate reference files for all pages
   */
  async generateReferences(
    pages: Page[],
    outputDir: string,
    category?: string,
  ): Promise<ReferenceFile[]> {
    this.moduleLogger.info('Generating reference files', {
      count: pages.length,
      outputDir,
      category,
    });

    const referencesDir = path.join(outputDir, 'references');
    const categoryDir = category ? path.join(referencesDir, category) : referencesDir;

    await ensureDir(categoryDir);

    const referenceFiles: ReferenceFile[] = [];

    for (const page of pages) {
      const filename = this.generateFilename(page);
      const filepath = path.join(categoryDir, filename);
      const content = this.generateReferenceContent(page);

      await writeFile(filepath, content);

      referenceFiles.push({
        filename,
        path: filepath,
        page,
      });
    }

    this.moduleLogger.info('Reference files generated', { count: referenceFiles.length });

    return referenceFiles;
  }

  /**
   * Generate filename from page URL
   */
  private generateFilename(page: Page): string {
    // Validate URL exists
    if (!page.url || typeof page.url !== 'string') {
      this.moduleLogger.error('Page missing URL', {
        title: page.title,
        hasContent: !!page.content,
      });
      throw new Error(
        `Cannot generate filename: Page missing URL. ` +
        `Title: "${page.title || 'unknown'}", ` +
        `Has content: ${!!page.content}`
      );
    }

    // Extract path from URL
    let url: URL;
    try {
      url = new URL(page.url);
    } catch (error) {
      this.moduleLogger.error('Invalid URL in page', {
        url: page.url,
        title: page.title,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Cannot generate filename: Invalid URL "${page.url}". ` +
        `Title: "${page.title || 'unknown'}". ` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    let filename = url.pathname;

    // Remove leading/trailing slashes
    filename = filename.replace(/^\/|\/$/g, '');

    // Replace slashes with hyphens
    filename = filename.replace(/\//g, '-');

    // Remove or replace invalid filename characters
    filename = filename.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Handle empty filename (root page)
    if (!filename) {
      filename = 'index';
    }

    // Add .md extension
    filename = `${filename}.md`;

    return filename;
  }

  /**
   * Generate markdown content for reference file
   */
  private generateReferenceContent(page: Page): string {
    const sections: string[] = [];

    // Title
    sections.push(`# ${page.title}\n`);

    // Metadata
    sections.push('## Metadata\n');
    sections.push(`- **URL**: ${page.url}`);
    if (page.category) {
      sections.push(`- **Category**: ${page.category}`);
    }
    sections.push('');

    // Content
    if (page.markdown) {
      sections.push('## Content\n');
      sections.push(page.markdown);
      sections.push('');
    }

    // Code Samples
    if (page.codeSamples.length > 0) {
      sections.push('## Code Samples\n');

      for (let i = 0; i < page.codeSamples.length; i++) {
        const sample = page.codeSamples[i];

        if (sample.context) {
          sections.push(`### ${sample.context}\n`);
        } else {
          sections.push(`### Example ${i + 1}\n`);
        }

        sections.push('```' + sample.language);
        sections.push(sample.code);
        sections.push('```\n');
      }
    }

    // Links
    if (page.links.length > 0) {
      sections.push('## Related Links\n');

      // Deduplicate and limit links
      const uniqueLinks = Array.from(new Set(page.links)).slice(0, 20);

      for (const link of uniqueLinks) {
        sections.push(`- ${link}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate index file listing all references
   */
  async generateIndex(
    referenceFiles: ReferenceFile[],
    outputDir: string,
    category?: string,
  ): Promise<string> {
    const referencesDir = path.join(outputDir, 'references');
    const categoryDir = category ? path.join(referencesDir, category) : referencesDir;
    const indexPath = path.join(categoryDir, 'INDEX.md');

    const sections: string[] = [];

    // Title
    if (category) {
      sections.push(`# ${category} References\n`);
    } else {
      sections.push('# Documentation References\n');
    }

    // Statistics
    sections.push(`Total Pages: ${referenceFiles.length}\n`);

    // File list
    sections.push('## Files\n');

    // Sort by filename
    const sortedFiles = [...referenceFiles].sort((a, b) =>
      a.filename.localeCompare(b.filename),
    );

    for (const file of sortedFiles) {
      const title = file.page.title || file.filename;
      sections.push(`- [${title}](./${file.filename})`);
    }

    const content = sections.join('\n');
    await writeFile(indexPath, content);

    this.moduleLogger.info('Index file generated', { path: indexPath });

    return indexPath;
  }

  /**
   * Generate all references with index
   */
  async generateAll(
    pages: Page[],
    outputDir: string,
    category?: string,
  ): Promise<{ referenceFiles: ReferenceFile[]; indexPath: string }> {
    const referenceFiles = await this.generateReferences(pages, outputDir, category);
    const indexPath = await this.generateIndex(referenceFiles, outputDir, category);

    return { referenceFiles, indexPath };
  }
}
