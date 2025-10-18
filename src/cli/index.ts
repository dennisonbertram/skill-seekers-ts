#!/usr/bin/env node
/**
 * CLI entry point for skill-seekers-ts
 * Provides commands: build, init, validate
 */

// Load environment variables from .env file
import 'dotenv/config';

import { Command } from 'commander';
import { CliLogger } from './utils/cli-logger';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { buildCommand } from './commands/build';
import * as path from 'path';
import * as fs from 'fs/promises';

const logger = new CliLogger();

// Get version from package.json
async function getVersion(): Promise<string> {
  try {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    return packageJson.version || '2.0.0';
  } catch {
    return '2.0.0';
  }
}

/**
 * Main CLI function
 */
async function main() {
  const version = await getVersion();
  const program = new Command();

  program
    .name('skill-seekers')
    .description('Convert documentation websites into Claude Code skills')
    .version(version);

  // Build command
  program
    .command('build')
    .description('Build a skill from documentation website')
    .option('--url <url>', 'Base URL to scrape')
    .option('--name <name>', 'Skill name')
    .option('--config <path>', 'Path to JSON config file')
    .option('--output <path>', 'Output directory (default: ./output/<name>)')
    .option('--max-pages <number>', 'Maximum pages to scrape', parseInt)
    .option('--rate-limit <seconds>', 'Delay between requests in seconds', parseFloat)
    .option('--firecrawl-key <key>', 'Firecrawl API key')
    .option('--no-firecrawl', 'Disable Firecrawl, use only Cheerio')
    .option('--categories <json>', 'Categories as JSON string')
    .option('--verbose', 'Enable verbose logging')
    .option('--quiet', 'Suppress output except errors')
    .action(async (options) => {
      try {
        if (!options.quiet) {
          logger.header(`skill-seekers-ts v${version}`);
          logger.blank();
        }

        const buildLogger = new CliLogger({
          verbose: options.verbose,
          quiet: options.quiet
        });

        // Prepare build options
        const buildOptions = {
          url: options.url,
          name: options.name,
          config: options.config,
          output: options.output,
          maxPages: options.maxPages,
          rateLimit: options.rateLimit,
          firecrawlKey: options.firecrawlKey,
          noFirecrawl: !options.firecrawl,
          categories: options.categories,
        };

        // Execute build
        if (!options.quiet) {
          const displayUrl = options.url || (options.config ? '(from config)' : 'unknown');
          buildLogger.info(`Scraping ${displayUrl}...`);
        }

        await buildCommand(buildOptions);

        if (!options.quiet) {
          buildLogger.success('Skill created successfully!');
          const outputDir = options.output || `./output/${options.name || '(from config)'}`;
          buildLogger.summary(`Output: ${outputDir}`);
          buildLogger.summary(`SKILL.md: ${path.join(outputDir, 'SKILL.md')}`);
        }
      } catch (error) {
        const err = error as Error;
        logger.error('Build failed', err, true);
        process.exit(1);
      }
    });

  // Init command
  program
    .command('init')
    .description('Generate a config template file')
    .requiredOption('--name <name>', 'Skill name')
    .requiredOption('--url <url>', 'Base URL to scrape')
    .option('--output <path>', 'Where to save config (default: ./skill-config.json)')
    .option('--description <text>', 'Skill description')
    .option('--overwrite', 'Overwrite existing file')
    .action(async (options) => {
      try {
        logger.header(`skill-seekers-ts v${version}`);
        logger.blank();

        const outputPath = options.output || './skill-config.json';

        await initCommand({
          name: options.name,
          url: options.url,
          output: outputPath,
          description: options.description,
          overwrite: options.overwrite,
          includeComments: true,
        });

        logger.success(`Created config file: ${outputPath}`);
        logger.info('Edit the file to customize selectors and categories');
      } catch (error) {
        const err = error as Error;
        logger.error('Init failed', err, true);
        process.exit(1);
      }
    });

  // Validate command
  program
    .command('validate')
    .description('Validate a config file')
    .requiredOption('--config <path>', 'Path to config file')
    .action(async (options) => {
      try {
        logger.header(`skill-seekers-ts v${version}`);
        logger.blank();

        const result = await validateCommand({ config: options.config });

        if (result.isValid) {
          logger.success('Configuration is valid');
          logger.blank();
          logger.info('Summary:');
          logger.list([
            `Name: ${result.summary!.name}`,
            `URL: ${result.summary!.url}`,
            `Max pages: ${result.summary!.maxPages}`,
            `Rate limit: ${result.summary!.rateLimit}s`,
            `Categories: ${result.summary!.categoryCount} defined`,
          ]);
        } else {
          logger.error('Configuration is invalid');
          logger.blank();
          logger.info('Errors:');
          logger.list(result.errors || []);
          process.exit(1);
        }
      } catch (error) {
        const err = error as Error;
        logger.error('Validation failed', err, true);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

// Run CLI
main().catch((error) => {
  logger.error('Fatal error', error, true);
  process.exit(1);
});
