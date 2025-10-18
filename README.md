# Skill Seekers TypeScript

> Convert documentation websites into Claude Code skills with intelligent scraping and AI enhancement

## Overview

Skill Seekers is a powerful CLI tool that automatically transforms online documentation into structured "skills" for use with Claude Code. It intelligently scrapes documentation websites, categorizes content, and generates enhanced reference materials that can be packaged and distributed.

## Features

- **Hybrid Scraping**: Primary Firecrawl API integration with Cheerio fallback for maximum flexibility
- **Smart Categorization**: Automatically organizes documentation by topic
- **Code Language Detection**: Identifies programming languages in code samples
- **Pattern Extraction**: Finds common usage patterns and best practices
- **AI Enhancement**: Uses Claude API or local Claude Code for content enhancement
- **Interactive CLI**: User-friendly command-line interface with progress indicators
- **ZIP Packaging**: Bundles skills for easy distribution

## Project Status

🚧 **Currently in active development** - TypeScript migration from Python version

See planning documents in `/docs` for detailed architecture and development strategy.

## Architecture

This is a complete TypeScript rewrite of the original Python Skill_Seekers tool, featuring:

- **Type Safety**: Full TypeScript with strict mode enabled
- **Modern Stack**: Built with latest Node.js features and ES modules
- **Test-Driven**: Comprehensive test suite with Vitest
- **Production Ready**: Error handling, logging, validation throughout

## Development Timeline

Estimated completion: 4-5 weeks with 3 developers

- **Week 1**: Foundation (types, utilities, testing infrastructure)
- **Week 2**: Scraper implementation (Firecrawl + Cheerio)
- **Week 3**: Skill builder (categorization, reference generation)
- **Week 4**: Enhancement system (API + local)
- **Week 5**: CLI & packaging
- **Week 6**: Testing, documentation, polish

See `/docs/DEPENDENCY_ANALYSIS.md` for detailed parallel execution strategy.

## Technology Stack

- **TypeScript** (5.4+) - Type-safe development
- **Node.js** (20+) - Runtime environment
- **Firecrawl** - Primary web scraping (with fallback)
- **Cheerio** - HTML parsing and fallback scraping
- **Commander** - CLI framework
- **Vitest** - Testing framework
- **Zod** - Runtime validation
- **Winston** - Structured logging
- **Anthropic SDK** - Claude API integration

## Documentation

Comprehensive planning documents available in `/docs`:

- **TYPESCRIPT_MIGRATION_PLAN.md** - Complete migration strategy and architecture
- **TDD_AND_FIRECRAWL_STRATEGY.md** - Testing approach and Firecrawl integration
- **DEPENDENCY_ANALYSIS.md** - Task dependencies and parallelization strategy

## Getting Started

### Setup (Issue #1 Complete)

```bash
# Install dependencies
npm install

# Build TypeScript project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Project Structure

```
src/
├── types/          # Type definitions and interfaces
│   ├── config.ts   # Config schema with Zod validation
│   ├── page.ts     # Page interface for scraped content
│   ├── scraper.ts  # IScraper interface
│   ├── builder.ts  # IBuilder interface
│   └── index.ts    # Type exports
├── utils/
│   └── logger.ts   # Winston logger setup
└── index.ts        # Main entry point

tests/
├── types/
│   ├── config.test.ts    # Config schema tests (TDD)
│   └── validation.test.ts # Sub-schema validation tests
└── setup.ts              # Test setup
```

### Core Types Available

- **Config**: Zod-validated configuration schema
- **Page**: Interface for scraped documentation pages
- **IScraper**: Interface for scraper implementations
- **IBuilder**: Interface for skill builders
- **Logger**: Winston logger instance

### Development Commands (Post-Development)

```bash
# Scrape documentation (to be implemented)
npm run cli -- scrape --config configs/example.json

# Build a skill (to be implemented)
npm run cli -- build --name example-skill

# Package a skill (to be implemented)
npm run cli -- package output/example-skill
```

## Contributing

This is currently under active development. See GitHub issues for work streams and tasks.

## License

MIT

## Authors

Built by the Skill Seekers team as part of the Model Context Protocol ecosystem.

---

**Status**: In Development | **Version**: 2.0.0-alpha | **Node**: 20+ | **TypeScript**: 5.4+
