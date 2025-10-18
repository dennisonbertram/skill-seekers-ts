# DEVELOPMENT - Issue #12: CLI Interface and Commands

## Task Details

Create a production-ready CLI that allows users to run skill-seekers-ts without writing code.

### Success Criteria
- [ ] All 3 commands implemented (build, init, validate)
- [ ] Comprehensive test coverage (95%+)
- [ ] CLI is executable via `npm link` or `npx`
- [ ] All flags work as documented
- [ ] Config file loading works
- [ ] Error handling is robust
- [ ] Help text is clear and complete

### Failure Conditions
- CLI doesn't execute via bin/skill-seekers.js
- Tests don't pass
- Type errors present
- Coverage below 95%
- Linting fails
- Config validation incomplete
- Error messages unclear

## Feasibility Assessment

**CAN THIS BE IMPLEMENTED WITH REAL DATA/APIS?** ✅ YES

- All core functionality (SkillBuilder, scraper, processor) already exists
- CLI will be a thin wrapper around existing APIs
- Commander.js is well-documented and proven
- No external API dependencies for CLI itself
- Config validation uses existing Zod schemas

**DEPENDENCY VERIFICATION** ✅ COMPLETE

Dependencies already in package.json:
- `commander` v12.0.0 - CLI framework
- `zod` v3.23.0 - Schema validation
- `winston` v3.13.0 - Logging
- All core modules tested and working

**CREDENTIAL REQUIREMENTS** ✅ HANDLED

- Firecrawl API key optional (--firecrawl-key flag or FIRECRAWL_API_KEY env)
- No other credentials needed for CLI operation
- Cheerio scraper works without credentials

## Implementation Plan

### Phase 1: CLI Infrastructure (TDD)
1. Create CLI entry point with Commander.js
2. Implement config file loader with Zod validation
3. Create CLI-friendly logger wrapper
4. Add user prompt utilities (for confirmations)

### Phase 2: Init Command (TDD)
1. Parse --name and --url flags
2. Generate config template
3. Validate output path
4. Write config file with proper formatting

### Phase 3: Validate Command (TDD)
1. Load config from file
2. Validate against ConfigSchema
3. Display validation results
4. Show helpful error messages for invalid configs

### Phase 4: Build Command (TDD)
1. Parse all build flags
2. Load config from file (if --config provided)
3. Merge flags with config (flags override)
4. Create ScraperFactory with proper options
5. Run full scrape -> process -> build pipeline
6. Display progress indicators
7. Handle errors gracefully

### Phase 5: Binary Setup
1. Create bin/skill-seekers.js shim
2. Update package.json with bin field
3. Test with npm link
4. Verify executable permissions

### Phase 6: Integration Testing
1. Test all commands end-to-end
2. Test flag combinations
3. Test error scenarios
4. Test config file loading

## Edge Cases

### Config File Loading
- Invalid JSON syntax → clear error with line number
- Missing required fields → list all missing fields
- Invalid URL format → show example of valid URL
- Negative numbers for rate_limit/max_pages → validation error

### Build Command
- Missing required flags → show usage help
- Invalid Firecrawl key → clear error, suggest --no-firecrawl
- Network errors during scrape → retry logic, clear error
- Output directory exists → confirm overwrite or fail
- No pages scraped → clear error message

### Init Command
- Output file exists → confirm overwrite
- Invalid skill name (special chars) → suggest valid name
- Invalid URL → show error, ask for valid URL

### Validate Command
- File doesn't exist → clear error
- Not a JSON file → clear error
- Valid JSON but wrong schema → detailed validation errors

## Blockers

None identified. All dependencies available, core functionality complete.

## Progress Tracking

### Phase 1: CLI Infrastructure
- [ ] 001: Test and implement config-loader utility
- [ ] 002: Test and implement CLI logger wrapper
- [ ] 003: Test and implement user prompts utility
- [ ] 004: Test and implement CLI entry point structure

### Phase 2: Init Command
- [ ] 005: Test and implement init command flag parsing
- [ ] 006: Test and implement config template generation
- [ ] 007: Test and implement file writing with overwrite check

### Phase 3: Validate Command
- [ ] 008: Test and implement validate command
- [ ] 009: Test and implement validation error formatting

### Phase 4: Build Command
- [ ] 010: Test and implement build command flag parsing
- [ ] 011: Test and implement config/flag merging logic
- [ ] 012: Test and implement scraper integration
- [ ] 013: Test and implement progress display
- [ ] 014: Test and implement error handling

### Phase 5: Binary Setup
- [ ] 015: Create bin/skill-seekers.js
- [ ] 016: Update package.json
- [ ] 017: Test npm link functionality

### Phase 6: Integration Testing
- [ ] 018: End-to-end tests for all commands
- [ ] 019: Test error scenarios
- [ ] 020: Test help text

## TDD Cycle Documentation

### Cycle 1: [Will be documented as implemented]

**RED:** [Test written and failing]

**GREEN:** [Minimal code to pass test]

**REFACTOR:** [Improvements made]

**REVIEW:** [Feedback and resolution]

---

## Code Review Status

- [ ] Initial implementation complete
- [ ] Code review requested
- [ ] Feedback addressed
- [ ] Final approval received

## Notes

- Follow strict TDD: RED → GREEN → REFACTOR
- Test error cases thoroughly
- Use existing types/schemas (don't redefine)
- CLI output should be user-friendly
- Progress indicators for long operations
- Clear, actionable error messages

---

## TDD Cycles Completed

### Cycle 1: Config Loader Utility

**RED Phase:**
- Created tests/cli/utils/config-loader.test.ts with 12 comprehensive tests
- Tests for: valid config loading, file not found, invalid JSON, invalid schema, validation errors, default values, URL validation, rate_limit/max_pages validation
- Test run failed (module not found) - RED confirmed ✓

**GREEN Phase:**
- Implemented src/cli/utils/config-loader.ts
- Created ConfigLoadError class with filePath and optional validationErrors
- Implemented loadConfig() function with:
  - File existence check
  - JSON parsing with error handling
  - Zod schema validation
  - Detailed error messages for validation failures
- All 12 tests passing ✓
- Type checking passes (npx tsc --noEmit) ✓

**REFACTOR Phase:**
- Code is clean and minimal for GREEN phase
- No refactoring needed at this stage

**VERIFICATION:**
- ✓ Tests: 12/12 passing
- ✓ Type safety: No TypeScript errors
- ✓ Uses existing types (Config, ConfigSchema) from types/config.ts
- ✓ Uses existing utils (readJsonFile, exists) from utils/fs.ts
- ✓ No hardcoded values
- ✓ Clear, actionable error messages

