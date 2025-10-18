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

## Getting Started (Post-Development)

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Scrape documentation
npm run cli -- scrape --config configs/example.json

# Build a skill
npm run cli -- build --name example-skill

# Package a skill
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
