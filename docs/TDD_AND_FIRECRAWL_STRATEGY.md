# TDD Strategy & Firecrawl Integration Plan

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Firecrawl Analysis](#firecrawl-analysis)
3. [TDD Methodology](#tdd-methodology)
4. [Red-Green-Refactor Implementation](#red-green-refactor-implementation)
5. [Test-First Development Plan](#test-first-development-plan)
6. [Firecrawl Integration Architecture](#firecrawl-integration-architecture)
7. [Cost-Benefit Analysis](#cost-benefit-analysis)

---

## Executive Summary

This document outlines:
1. **Firecrawl Integration**: How to leverage Firecrawl API to simplify scraping
2. **TDD Strategy**: Comprehensive test-driven development approach
3. **Hybrid Approach**: Combining Firecrawl (primary) with custom scraper (fallback)

**Key Decision**: Use **Firecrawl as primary scraper** with **custom fallback** for:
- Offline/local development
- Cost control
- Proprietary/internal documentation sites

---

## Firecrawl Analysis

### What is Firecrawl?

**Firecrawl** is a production-ready web scraping service that:
- Crawls websites and converts to clean markdown/HTML
- Handles JavaScript rendering automatically
- Bypasses anti-scraping mechanisms
- Provides structured data extraction
- Offers batch processing

### TypeScript SDK

```typescript
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: 'fc-YOUR_API_KEY' });

// Scrape single URL
const doc = await firecrawl.scrape('https://docs.example.com', {
  formats: ['markdown', 'html', 'links']
});

// Crawl entire site
const result = await firecrawl.crawl('https://docs.example.com', {
  limit: 100,
  maxDepth: 3,
  includePaths: ['docs/**'],
  excludePaths: ['blog/**'],
  scrapeOptions: {
    formats: ['markdown', 'html']
  }
});
```

### Key Features

| Feature | Description | Benefit for Skill_Seekers |
|---------|-------------|---------------------------|
| **Auto JS Rendering** | Handles dynamic content | Works with modern docs sites |
| **Clean Markdown** | LLM-ready output | Perfect for Claude skills |
| **Crawling** | Follows links automatically | No manual link discovery |
| **Rate Limiting** | Built-in | No manual throttling needed |
| **Metadata Extraction** | Titles, descriptions, keywords | Better categorization |
| **Batch Processing** | Async job queue | Faster large-scale scraping |
| **Browser Actions** | Click, type, wait | Handle interactive docs |

### Pricing Analysis

**Firecrawl Pricing** (as of 2024):
- **Free Tier**: 500 credits/month
- **Starter**: $19/month - 3,000 credits
- **Standard**: $99/month - 20,000 credits
- **Scale**: $299/month - 100,000 credits

**Credit Usage**:
- Scrape: 1 credit per page
- Crawl: 1 credit per page crawled
- Extract (structured): 50 credits per page

**For Skill_Seekers**:
- Average doc site: 200-500 pages
- Cost per skill: $0.20-$0.50 (with starter plan)
- Very affordable for occasional use

### Pros & Cons

**Pros:**
✅ No need to handle JavaScript rendering
✅ Bypasses anti-bot protection automatically
✅ Clean, LLM-ready markdown output
✅ Official TypeScript SDK
✅ Handles rate limiting internally
✅ Metadata extraction built-in
✅ Parallel crawling built-in
✅ Less code to maintain
✅ Production-tested infrastructure

**Cons:**
❌ Requires API key (cost)
❌ Depends on external service (uptime)
❌ Can't use offline
❌ Rate limits based on plan
❌ Less control over scraping logic
❌ Privacy concerns for private docs

---

## TDD Methodology

### Core Principles

**Test-Driven Development (TDD)** follows this cycle:

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code while keeping tests green

### Why TDD for This Project?

1. **Type Safety + Runtime Safety**: TypeScript checks types, tests verify behavior
2. **Regression Prevention**: Catch bugs before they ship
3. **Living Documentation**: Tests show how code should work
4. **Refactoring Confidence**: Change code fearlessly
5. **Better Design**: Test-first leads to better APIs

### Test Pyramid Strategy

```
        /\
       /  \  E2E Tests (5%)
      /____\
     /      \
    /        \ Integration Tests (15%)
   /__________\
  /            \
 /              \ Unit Tests (80%)
/________________\
```

**Unit Tests (80%)**:
- Individual functions/methods
- Fast (<10ms each)
- No external dependencies
- Mocked I/O

**Integration Tests (15%)**:
- Multiple components together
- Real file system
- Mocked network
- Moderate speed (~100ms)

**E2E Tests (5%)**:
- Complete workflows
- Real or stubbed APIs
- Slow (seconds)
- Critical paths only

---

## Red-Green-Refactor Implementation

### Example 1: Language Detector (Unit Test)

#### RED: Write the Test First

```typescript
// tests/unit/language-detector.test.ts
import { describe, it, expect } from 'vitest';
import { LanguageDetector } from '@/core/scraper/LanguageDetector';

describe('LanguageDetector', () => {
  const detector = new LanguageDetector();

  describe('detectFromCode', () => {
    it('should detect Python from import statements', () => {
      const code = 'import sys\nfrom pathlib import Path\n\ndef main():';

      const result = detector.detectFromCode(code);

      expect(result).toBe('python');
    });

    it('should detect JavaScript from const/let/arrow functions', () => {
      const code = 'const foo = (bar) => {\n  return bar + 1;\n};';

      const result = detector.detectFromCode(code);

      expect(result).toBe('javascript');
    });

    it('should detect GDScript from func keyword', () => {
      const code = 'func _ready():\n\tvar player = Node2D.new()';

      const result = detector.detectFromCode(code);

      expect(result).toBe('gdscript');
    });

    it('should detect C++ from include and namespace', () => {
      const code = '#include <iostream>\nnamespace std;';

      const result = detector.detectFromCode(code);

      expect(result).toBe('cpp');
    });

    it('should return "unknown" for ambiguous code', () => {
      const code = 'foo bar baz\n123 456';

      const result = detector.detectFromCode(code);

      expect(result).toBe('unknown');
    });
  });
});
```

**Run test**: ❌ FAILS (class doesn't exist yet)

#### GREEN: Minimal Implementation

```typescript
// src/core/scraper/LanguageDetector.ts
export class LanguageDetector {
  detectFromCode(code: string): string {
    // Python detection
    if (code.includes('import ') && code.includes('def ')) {
      return 'python';
    }
    if (code.includes('from ') && code.includes('import')) {
      return 'python';
    }

    // JavaScript detection
    if (code.includes('const ') || code.includes('let ')) {
      return 'javascript';
    }
    if (code.includes('=>')) {
      return 'javascript';
    }

    // GDScript detection
    if (code.includes('func ') && code.includes('var ')) {
      return 'gdscript';
    }

    // C++ detection
    if (code.includes('#include') && code.includes('namespace')) {
      return 'cpp';
    }
    if (code.includes('#include') || code.includes('iostream')) {
      return 'cpp';
    }

    return 'unknown';
  }
}
```

**Run test**: ✅ PASSES

#### REFACTOR: Improve Design

```typescript
// src/core/scraper/LanguageDetector.ts

interface LanguagePattern {
  language: string;
  patterns: RegExp[];
  minMatches: number;
}

export class LanguageDetector {
  private readonly languagePatterns: LanguagePattern[] = [
    {
      language: 'python',
      patterns: [
        /^import\s+\w+/m,
        /^from\s+\w+\s+import/m,
        /^def\s+\w+\(/m,
        /^class\s+\w+:/m,
      ],
      minMatches: 1,
    },
    {
      language: 'javascript',
      patterns: [
        /\b(const|let|var)\s+\w+\s*=/,
        /=>\s*{/,
        /function\s+\w+\(/,
        /\b(async|await)\b/,
      ],
      minMatches: 1,
    },
    {
      language: 'gdscript',
      patterns: [
        /^func\s+\w+\(/m,
        /^var\s+\w+\s*=/m,
        /\bextends\s+\w+/,
        /\b_ready\(/,
      ],
      minMatches: 2,
    },
    {
      language: 'cpp',
      patterns: [
        /#include\s*[<"]/,
        /\bnamespace\s+\w+/,
        /\bstd::/,
        /int\s+main\s*\(/,
      ],
      minMatches: 1,
    },
  ];

  detectFromCode(code: string): string {
    for (const { language, patterns, minMatches } of this.languagePatterns) {
      const matchCount = patterns.filter(pattern => pattern.test(code)).length;

      if (matchCount >= minMatches) {
        return language;
      }
    }

    return 'unknown';
  }
}
```

**Run test**: ✅ STILL PASSES

**Refactoring Benefits**:
- More maintainable (add new languages easily)
- More robust (regex patterns)
- More testable (configurable patterns)
- Better separation of concerns

---

### Example 2: Firecrawl Scraper (Integration Test)

#### RED: Write Test First

```typescript
// tests/integration/firecrawl-scraper.test.ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { FirecrawlScraper } from '@/core/scraper/FirecrawlScraper';
import type { Config } from '@/types/config';

describe('FirecrawlScraper Integration', () => {
  const mockConfig: Config = {
    name: 'test-docs',
    description: 'Test documentation',
    base_url: 'https://example.com/docs/',
    selectors: {
      main_content: 'article',
      title: 'h1',
      code_blocks: 'pre code',
    },
    url_patterns: {
      include: ['/docs/'],
      exclude: ['/blog/'],
    },
    rate_limit: 0.5,
    max_pages: 10,
  };

  describe('scrapeAll', () => {
    it('should crawl website and return pages', async () => {
      const scraper = new FirecrawlScraper(mockConfig, 'fake-api-key');

      const pages = await scraper.scrapeAll();

      expect(pages).toBeDefined();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages[0]).toHaveProperty('url');
      expect(pages[0]).toHaveProperty('title');
      expect(pages[0]).toHaveProperty('markdown');
      expect(pages[0]).toHaveProperty('metadata');
    });

    it('should respect max_pages limit', async () => {
      const scraper = new FirecrawlScraper(mockConfig, 'fake-api-key');

      const pages = await scraper.scrapeAll();

      expect(pages.length).toBeLessThanOrEqual(mockConfig.max_pages);
    });

    it('should extract code samples from markdown', async () => {
      const scraper = new FirecrawlScraper(mockConfig, 'fake-api-key');

      const pages = await scraper.scrapeAll();
      const pagesWithCode = pages.filter(p => p.code_samples.length > 0);

      expect(pagesWithCode.length).toBeGreaterThan(0);
      expect(pagesWithCode[0].code_samples[0]).toHaveProperty('code');
      expect(pagesWithCode[0].code_samples[0]).toHaveProperty('language');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid API key', async () => {
      const scraper = new FirecrawlScraper(mockConfig, 'invalid-key');

      await expect(scraper.scrapeAll()).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors gracefully', async () => {
      const badConfig = { ...mockConfig, base_url: 'https://nonexistent.invalid/' };
      const scraper = new FirecrawlScraper(badConfig, 'fake-api-key');

      await expect(scraper.scrapeAll()).rejects.toThrow();
    });
  });
});
```

**Run test**: ❌ FAILS (no implementation)

#### GREEN: Minimal Implementation

```typescript
// src/core/scraper/FirecrawlScraper.ts
import Firecrawl from '@mendable/firecrawl-js';
import type { Config } from '@/types/config';
import type { Page, CodeSample } from '@/types/page';

export class FirecrawlScraper {
  private firecrawl: Firecrawl;

  constructor(
    private config: Config,
    apiKey: string
  ) {
    this.firecrawl = new Firecrawl({ apiKey });
  }

  async scrapeAll(): Promise<Page[]> {
    try {
      // Use Firecrawl's crawl API
      const response = await this.firecrawl.crawl(this.config.base_url, {
        limit: this.config.max_pages,
        maxDepth: 3,
        includePaths: this.config.url_patterns.include,
        excludePaths: this.config.url_patterns.exclude,
        scrapeOptions: {
          formats: ['markdown', 'html', 'links'],
        },
      });

      // Transform Firecrawl response to our Page format
      return response.data.map(item => this.transformToPage(item));
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Invalid API key');
      }
      throw error;
    }
  }

  private transformToPage(firecrawlPage: any): Page {
    const codeSamples = this.extractCodeSamples(firecrawlPage.markdown);

    return {
      url: firecrawlPage.metadata.sourceURL,
      title: firecrawlPage.metadata.title || '',
      content: firecrawlPage.markdown || '',
      headings: this.extractHeadings(firecrawlPage.markdown),
      code_samples: codeSamples,
      patterns: [],
      links: firecrawlPage.links || [],
    };
  }

  private extractCodeSamples(markdown: string): CodeSample[] {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const samples: CodeSample[] = [];
    let match;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      samples.push({
        language: match[1] || 'unknown',
        code: match[2].trim(),
      });
    }

    return samples;
  }

  private extractHeadings(markdown: string): any[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: any[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      headings.push({
        level: `h${match[1].length}`,
        text: match[2].trim(),
        id: match[2].toLowerCase().replace(/\s+/g, '-'),
      });
    }

    return headings;
  }
}
```

**Run test**: ✅ PASSES (with mocked Firecrawl API)

#### REFACTOR: Add Abstractions

```typescript
// src/core/scraper/IScraper.ts
export interface IScraper {
  scrapeAll(): Promise<Page[]>;
  scrapeSingle(url: string): Promise<Page>;
}

// src/core/scraper/FirecrawlScraper.ts
export class FirecrawlScraper implements IScraper {
  // ... implementation
}

// src/core/scraper/CheerioScraper.ts
export class CheerioScraper implements IScraper {
  // Fallback implementation for offline use
}

// src/core/scraper/ScraperFactory.ts
export class ScraperFactory {
  static create(config: Config, options: ScraperOptions): IScraper {
    if (options.useFirecrawl && options.apiKey) {
      return new FirecrawlScraper(config, options.apiKey);
    }
    return new CheerioScraper(config);
  }
}
```

---

### Example 3: End-to-End Test

#### RED: E2E Test for Complete Workflow

```typescript
// tests/e2e/complete-skill-creation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';

const execAsync = promisify(exec);

describe('E2E: Complete Skill Creation', () => {
  const outputDir = join(__dirname, '../../output');
  const configPath = join(__dirname, '../fixtures/test-config.json');

  beforeAll(async () => {
    // Clean up any previous test runs
    try {
      await rm(join(outputDir, 'test-skill'), { recursive: true, force: true });
      await rm(join(outputDir, 'test-skill_data'), { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up after test
    await rm(join(outputDir, 'test-skill'), { recursive: true, force: true });
    await rm(join(outputDir, 'test-skill_data'), { recursive: true, force: true });
  });

  it('should create a complete skill from config', async () => {
    // Step 1: Scrape (this would use mock Firecrawl in CI)
    const { stdout: scrapeOutput } = await execAsync(
      `npm run cli -- scrape --config ${configPath}`,
      { timeout: 60000 }
    );

    expect(scrapeOutput).toContain('Scraped');
    expect(scrapeOutput).toContain('pages');

    // Verify scraped data exists
    const dataDir = join(outputDir, 'test-skill_data');
    await access(dataDir); // Throws if doesn't exist

    // Step 2: Build skill
    const { stdout: buildOutput } = await execAsync(
      `npm run cli -- build --name test-skill`,
      { timeout: 30000 }
    );

    expect(buildOutput).toContain('Skill built');

    // Verify skill directory structure
    const skillDir = join(outputDir, 'test-skill');
    await access(join(skillDir, 'SKILL.md'));
    await access(join(skillDir, 'references'));

    // Verify SKILL.md content
    const skillMd = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('---');
    expect(skillMd).toContain('name: test-skill');
    expect(skillMd).toContain('Quick Reference');
    expect(skillMd).toContain('## Reference Files');

    // Step 3: Package skill
    const { stdout: packageOutput } = await execAsync(
      `npm run cli -- package ${skillDir}`,
      { timeout: 10000 }
    );

    expect(packageOutput).toContain('Package created');

    // Verify ZIP exists
    await access(join(outputDir, 'test-skill.zip'));
  }, 120000); // 2 minute timeout for E2E test

  it('should handle errors gracefully with invalid config', async () => {
    const badConfigPath = join(__dirname, '../fixtures/invalid-config.json');

    await expect(
      execAsync(`npm run cli -- scrape --config ${badConfigPath}`)
    ).rejects.toThrow();
  });
});
```

---

## Test-First Development Plan

### Phase 1: Core Types & Utilities (Week 1)

#### Day 1-2: Configuration System

**Test 1: Config Schema Validation**
```typescript
// RED
it('should validate valid config', () => {
  const config = { name: 'test', base_url: 'https://example.com', ... };
  expect(() => ConfigSchema.parse(config)).not.toThrow();
});

it('should reject invalid URLs', () => {
  const config = { name: 'test', base_url: 'not-a-url', ... };
  expect(() => ConfigSchema.parse(config)).toThrow('Invalid url');
});

// GREEN: Implement Zod schema
export const ConfigSchema = z.object({
  name: z.string().min(1),
  base_url: z.string().url(),
  // ...
});

// REFACTOR: Add custom error messages
```

**Test 2: Config Loader**
```typescript
// RED
it('should load config from JSON file', async () => {
  const config = await loadConfig('./test-config.json');
  expect(config.name).toBe('test-docs');
});

// GREEN: Implement loader
export async function loadConfig(path: string): Promise<Config> {
  const raw = await readFile(path, 'utf-8');
  return ConfigSchema.parse(JSON.parse(raw));
}

// REFACTOR: Add error handling, file existence check
```

#### Day 3-4: File System Utilities

**Test 3: Cache Detection**
```typescript
// RED
it('should detect existing scraped data', async () => {
  const exists = await hasExistingData('test-skill');
  expect(exists).toBe(true);
});

it('should return false for non-existent data', async () => {
  const exists = await hasExistingData('nonexistent');
  expect(exists).toBe(false);
});

// GREEN: Implement
export async function hasExistingData(name: string): Promise<boolean> {
  const path = join('output', `${name}_data`, 'summary.json');
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
```

#### Day 5: Logger Setup

**Test 4: Structured Logging**
```typescript
// RED
it('should log with correct levels', () => {
  const logs: string[] = [];
  const logger = createLogger({ onLog: (msg) => logs.push(msg) });

  logger.info('test message');
  logger.error('error message');

  expect(logs).toHaveLength(2);
  expect(logs[0]).toContain('INFO');
  expect(logs[1]).toContain('ERROR');
});

// GREEN: Implement with winston
```

---

### Phase 2: Scraper Implementation (Week 2)

#### Day 1-2: Firecrawl Integration

**Test 5: Firecrawl Scraper - Happy Path**
```typescript
// RED
it('should scrape using Firecrawl API', async () => {
  const scraper = new FirecrawlScraper(config, apiKey);
  const pages = await scraper.scrapeAll();

  expect(pages.length).toBeGreaterThan(0);
  expect(pages[0].markdown).toBeDefined();
});

// GREEN: Implement (shown earlier)

// REFACTOR: Extract transformers, add retry logic
```

**Test 6: Code Sample Extraction**
```typescript
// RED
it('should extract code blocks with language tags', () => {
  const markdown = '```python\nprint("hello")\n```';
  const samples = extractCodeSamples(markdown);

  expect(samples).toHaveLength(1);
  expect(samples[0].language).toBe('python');
  expect(samples[0].code).toBe('print("hello")');
});

// GREEN: Implement regex extractor

// REFACTOR: Handle edge cases (nested blocks, invalid syntax)
```

#### Day 3-4: Fallback Scraper (Cheerio)

**Test 7: Cheerio Scraper**
```typescript
// RED
it('should scrape with Cheerio when Firecrawl unavailable', async () => {
  const scraper = new CheerioScraper(config);
  const page = await scraper.scrapeSingle('https://example.com');

  expect(page.title).toBeDefined();
  expect(page.content).toBeDefined();
});

// GREEN: Implement with axios + cheerio

// REFACTOR: Add rate limiting, error handling
```

#### Day 5: Scraper Factory

**Test 8: Factory Pattern**
```typescript
// RED
it('should create Firecrawl scraper when API key provided', () => {
  const scraper = ScraperFactory.create(config, { useFirecrawl: true, apiKey: 'key' });
  expect(scraper).toBeInstanceOf(FirecrawlScraper);
});

it('should create Cheerio scraper as fallback', () => {
  const scraper = ScraperFactory.create(config, { useFirecrawl: false });
  expect(scraper).toBeInstanceOf(CheerioScraper);
});

// GREEN: Implement factory

// REFACTOR: Add strategy pattern
```

---

### Phase 3: Skill Builder (Week 3)

#### Day 1-2: Categorizer

**Test 9: Smart Categorization**
```typescript
// RED
it('should categorize pages by URL patterns', () => {
  const pages = [
    { url: 'https://ex.com/docs/api/auth', title: 'Auth API' },
    { url: 'https://ex.com/docs/guides/intro', title: 'Intro' },
  ];
  const categories = categorizer.categorize(pages);

  expect(categories.api).toContain(pages[0]);
  expect(categories.guides).toContain(pages[1]);
});

it('should infer categories when not provided', () => {
  const pages = createMockPages();
  const categories = categorizer.categorize(pages);

  expect(Object.keys(categories).length).toBeGreaterThan(0);
});

// GREEN: Implement scoring algorithm

// REFACTOR: Make configurable, add weights
```

#### Day 3-4: Reference Generator

**Test 10: Reference File Creation**
```typescript
// RED
it('should generate markdown reference file', async () => {
  const pages = createMockPages();
  await generator.createReferenceFile('api', pages, outputDir);

  const content = await readFile(join(outputDir, 'api.md'), 'utf-8');
  expect(content).toContain('# API');
  expect(content).toContain('```');
});

// GREEN: Implement template-based generator

// REFACTOR: Extract templates, add formatting options
```

#### Day 5: SKILL.md Generator

**Test 11: SKILL.md with Examples**
```typescript
// RED
it('should include real code examples in SKILL.md', async () => {
  const quickRef = { patterns: [], examples: mockCodeSamples };
  const skillMd = await generator.generateSkillMd(metadata, categories, quickRef);

  expect(skillMd).toContain('```python');
  expect(skillMd).toContain('Quick Reference');
  expect(skillMd).toMatch(/^---\nname:/);
});

// GREEN: Implement template

// REFACTOR: Make customizable
```

---

### Phase 4: Enhancement System (Week 4)

**Test 12: API Enhancement**
```typescript
// RED
it('should enhance SKILL.md using Claude API', async () => {
  const enhancer = new ApiEnhancer(apiKey);
  const enhanced = await enhancer.enhance(skillDir);

  expect(enhanced).toBe(true);
  const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
  expect(content.length).toBeGreaterThan(originalLength);
});

// GREEN: Implement with @anthropic-ai/sdk

// REFACTOR: Add retry, timeout, streaming
```

**Test 13: Local Enhancement**
```typescript
// RED
it('should launch terminal for local enhancement', async () => {
  const enhancer = new LocalEnhancer();
  const launched = await enhancer.enhance(skillDir);

  expect(launched).toBe(true);
  // Verify prompt file created
  // Verify terminal command executed
});

// GREEN: Implement with child_process

// REFACTOR: Add cross-platform support
```

---

### Phase 5: CLI & Packaging (Week 5)

**Test 14: CLI Commands**
```typescript
// RED
it('should execute scrape command', async () => {
  const result = await execCLI(['scrape', '--config', configPath]);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Scraped');
});

// GREEN: Implement with Commander

// REFACTOR: Add progress bars, colors
```

**Test 15: ZIP Packaging**
```typescript
// RED
it('should create ZIP file with correct structure', async () => {
  await packager.package(skillDir);

  const zipPath = join(outputDir, 'skill.zip');
  await access(zipPath);

  // Verify ZIP contents
  const entries = await listZipEntries(zipPath);
  expect(entries).toContain('SKILL.md');
  expect(entries).toContain('references/api.md');
});

// GREEN: Implement with archiver

// REFACTOR: Add compression options
```

---

## Firecrawl Integration Architecture

### Hybrid Approach: Best of Both Worlds

```typescript
// src/core/scraper/IScraper.ts
export interface IScraper {
  scrapeAll(): Promise<Page[]>;
  scrapeSingle(url: string): Promise<Page>;
  validateConnection(): Promise<boolean>;
}

// src/core/scraper/HybridScraper.ts
export class HybridScraper implements IScraper {
  private primary: IScraper;
  private fallback: IScraper;

  constructor(config: Config, options: ScraperOptions) {
    this.primary = new FirecrawlScraper(config, options.apiKey);
    this.fallback = new CheerioScraper(config);
  }

  async scrapeAll(): Promise<Page[]> {
    try {
      // Try Firecrawl first
      const canConnect = await this.primary.validateConnection();
      if (canConnect) {
        logger.info('Using Firecrawl for scraping');
        return await this.primary.scrapeAll();
      }
    } catch (error) {
      logger.warn('Firecrawl unavailable, falling back to Cheerio', { error });
    }

    // Fallback to Cheerio
    logger.info('Using Cheerio scraper');
    return await this.fallback.scrapeAll();
  }

  async scrapeSingle(url: string): Promise<Page> {
    try {
      return await this.primary.scrapeSingle(url);
    } catch {
      return await this.fallback.scrapeSingle(url);
    }
  }

  async validateConnection(): Promise<boolean> {
    return await this.primary.validateConnection();
  }
}
```

### Configuration

```typescript
// Config with Firecrawl options
export const ConfigSchema = z.object({
  name: z.string(),
  base_url: z.string().url(),
  // ... other fields

  // Firecrawl-specific
  firecrawl: z.object({
    enabled: z.boolean().default(true),
    apiKey: z.string().optional(),
    maxDepth: z.number().default(3),
    timeout: z.number().default(300000), // 5 minutes
  }).optional(),

  // Fallback scraper options
  fallback: z.object({
    enabled: z.boolean().default(true),
    rateLimit: z.number().default(0.5),
    timeout: z.number().default(30000),
  }).optional(),
});
```

### Usage Examples

**With Firecrawl (Primary)**:
```bash
# Use Firecrawl API
export FIRECRAWL_API_KEY=fc-your-key
npm run cli -- scrape --config configs/react.json

# Or provide inline
npm run cli -- scrape --config configs/react.json --firecrawl-key fc-your-key
```

**Without Firecrawl (Fallback)**:
```bash
# Disable Firecrawl, use Cheerio
npm run cli -- scrape --config configs/react.json --no-firecrawl
```

**Offline Mode**:
```bash
# For local/internal docs
npm run cli -- scrape --url http://localhost:3000/docs --no-firecrawl
```

---

## Cost-Benefit Analysis

### Firecrawl vs Custom Scraper

| Aspect | Firecrawl | Custom (Cheerio) |
|--------|-----------|------------------|
| **Cost** | $0.01-0.50/skill | Free |
| **Dev Time** | 2 days | 5 days |
| **Maintenance** | Low (API updates) | Medium (handle edge cases) |
| **JS Rendering** | ✅ Automatic | ❌ Need Puppeteer |
| **Anti-Bot** | ✅ Handled | ❌ Manual workarounds |
| **Rate Limiting** | ✅ Built-in | 🔧 Manual implementation |
| **Reliability** | ✅ Production-tested | ⚠️ Depends on impl |
| **Offline** | ❌ No | ✅ Yes |
| **Privacy** | ⚠️ External service | ✅ Local only |

### Recommendation

**Use Firecrawl** when:
✅ Scraping public documentation
✅ Need JS rendering
✅ Want faster development
✅ Budget allows ($0.20-0.50/skill)
✅ Internet connection available

**Use Custom Scraper** when:
✅ Scraping internal/private docs
✅ Working offline
✅ Need full control
✅ Zero cost requirement
✅ High volume (>1000 skills/month)

**Hybrid Approach** (Recommended):
- Primary: Firecrawl (85% of use cases)
- Fallback: Cheerio (15% of use cases)
- Best user experience
- Maximum flexibility

---

## Testing Strategy Summary

### Test Coverage Goals

```
Category          | Target | Actual | Status
------------------|--------|--------|--------
Unit Tests        | 80%    | TBD    | 🎯
Integration Tests | 60%    | TBD    | 🎯
E2E Tests         | 50%    | TBD    | 🎯
Overall           | 75%    | TBD    | 🎯
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}

      - name: Coverage report
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Mock Strategy

**Unit Tests**: Mock everything
```typescript
vi.mock('@mendable/firecrawl-js', () => ({
  default: vi.fn(() => ({
    crawl: vi.fn().mockResolvedValue(mockCrawlResponse),
    scrape: vi.fn().mockResolvedValue(mockScrapeResponse),
  })),
}));
```

**Integration Tests**: Mock external APIs only
```typescript
// Mock Firecrawl API responses
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://api.firecrawl.dev/v2/crawl', () => {
    return HttpResponse.json(mockCrawlResponse);
  })
);
```

**E2E Tests**: Use test fixtures or real API with test account
```typescript
// Use real Firecrawl with test account in CI
const apiKey = process.env.FIRECRAWL_TEST_KEY || 'mock-key';
```

---

## Implementation Checklist

### Phase 1: Setup (Week 1)
- [ ] Initialize TypeScript project
- [ ] Configure Vitest
- [ ] Set up CI/CD
- [ ] Create type definitions
- [ ] Test: Config validation
- [ ] Test: File system utilities
- [ ] Test: Logger

### Phase 2: Scraper (Week 2)
- [ ] Test: Firecrawl integration
- [ ] Test: Code extraction
- [ ] Test: Language detection
- [ ] Test: Cheerio fallback
- [ ] Test: Scraper factory
- [ ] Test: Error handling

### Phase 3: Builder (Week 3)
- [ ] Test: Categorization
- [ ] Test: Reference generation
- [ ] Test: SKILL.md generation
- [ ] Test: Pattern extraction
- [ ] Test: Quick reference

### Phase 4: Enhancement (Week 4)
- [ ] Test: API enhancement
- [ ] Test: Local enhancement
- [ ] Test: Prompt building
- [ ] Test: Backup/restore

### Phase 5: CLI (Week 5)
- [ ] Test: CLI commands
- [ ] Test: Interactive mode
- [ ] Test: Progress indicators
- [ ] Test: ZIP packaging

### Phase 6: E2E (Week 6)
- [ ] Test: Complete workflow
- [ ] Test: Error scenarios
- [ ] Test: Edge cases
- [ ] Performance testing
- [ ] Documentation

---

## Conclusion

This TDD strategy combined with Firecrawl integration provides:

1. **Faster Development**: Firecrawl reduces scraping code by ~70%
2. **Higher Quality**: TDD ensures robust, tested code
3. **Flexibility**: Hybrid approach works online and offline
4. **Maintainability**: Well-tested code is easier to maintain
5. **Confidence**: Comprehensive tests enable fearless refactoring

**Next Steps**:
1. Set up project skeleton
2. Write first tests (config validation)
3. Implement TDD cycle
4. Integrate Firecrawl
5. Build out features test-first

**Estimated Timeline**: 6 weeks (same as original plan, but higher quality)
