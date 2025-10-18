# Issue #5: Cheerio Scraper Implementation

## Task Details
Implement the Cheerio scraper for local/offline HTML parsing. This is the fallback scraper that doesn't require an API key and works with direct HTML parsing using cheerio (similar to Python's BeautifulSoup).

## Success Criteria
- [ ] CheerioScraper implements IScraper interface
- [ ] validateConnection() works correctly
- [ ] scrapeSingle() extracts page data with code samples
- [ ] scrapeAll() crawls multiple pages with rate limiting
- [ ] Code sample extraction with language detection (class-based + content-based)
- [ ] Link extraction and normalization (relative → absolute)
- [ ] Link filtering based on include/exclude patterns
- [ ] Respects max_pages limit
- [ ] Handles errors gracefully (skips failed pages)
- [ ] All tests pass (20+ tests)
- [ ] 80%+ test coverage
- [ ] npm run build succeeds
- [ ] npm run lint passes

## Feasibility Assessment
- **Real Implementation**: YES - Uses actual cheerio library for HTML parsing
- **No Fake Data**: YES - Tests will use real HTML structures with mocked HTTP responses
- **Dependencies Available**: YES - cheerio and axios are standard Node.js packages
- **No Hardcoding**: YES - All configuration from Config object

## Implementation Plan

### Phase 1: Setup and Basic Structure
1. Write failing tests for CheerioScraper constructor
2. Implement constructor (RED-GREEN-REFACTOR)
3. Write tests for IScraper interface compliance
4. Verify implements all required methods

### Phase 2: Connection Validation
1. Write failing tests for validateConnection
2. Implement HTTP request with axios
3. Test success and error cases
4. Refactor for clean error handling

### Phase 3: Single Page Scraping
1. Write failing tests for scrapeSingle
2. Implement HTML parsing with cheerio
3. Extract title, content using selectors
4. Test edge cases (missing elements, empty content)

### Phase 4: Code Sample Extraction
1. Write tests for language detection from class attributes
2. Implement class-based detection patterns
3. Write tests for content-based detection fallback
4. Integrate LanguageDetector for fallback
5. Test empty code blocks, various formats

### Phase 5: Link Extraction
1. Write tests for link extraction
2. Implement relative-to-absolute URL conversion
3. Write tests for link filtering
4. Implement include/exclude pattern matching
5. Test edge cases (malformed URLs, self-links)

### Phase 6: Full Crawling
1. Write tests for scrapeAll
2. Implement breadth-first crawling
3. Test max_pages limit enforcement
4. Test visited URL tracking
5. Implement rate limiting
6. Test error handling during crawl

### Phase 7: Integration & Polish
1. Update exports in index.ts
2. Run full test suite
3. Check coverage
4. Run build and lint
5. Document any gotchas

## Progress Tracking

### TDD Cycles Log
- [ ] Cycle 1: Constructor and instance creation
- [ ] Cycle 2: validateConnection success case
- [ ] Cycle 3: validateConnection error case
- [ ] Cycle 4: scrapeSingle basic extraction
- [ ] Cycle 5: scrapeSingle title extraction
- [ ] Cycle 6: scrapeSingle missing elements handling
- [ ] Cycle 7: Code sample extraction with language classes
- [ ] Cycle 8: Code sample content-based detection
- [ ] Cycle 9: Code sample empty block filtering
- [ ] Cycle 10: Link extraction and normalization
- [ ] Cycle 11: Link filtering logic
- [ ] Cycle 12: scrapeAll basic crawling
- [ ] Cycle 13: scrapeAll max_pages enforcement
- [ ] Cycle 14: scrapeAll visited URL tracking
- [ ] Cycle 15: scrapeAll error handling

## Dependencies Verification
- cheerio: HTML parsing library (needs installation)
- axios: Already in project (used by FirecrawlScraper)
- IScraper interface: Exists in src/types/scraper.ts
- LanguageDetector: Exists in src/utils/language-detector.ts
- Logger: Exists in src/utils/logger.ts

## Notes
- Cheerio uses jQuery-like syntax for HTML parsing
- Must handle both relative and absolute URLs properly
- Language detection should try class attributes first, then fall back to content
- Rate limiting is important to avoid overwhelming servers
- Error handling should be graceful - skip failed pages rather than crash