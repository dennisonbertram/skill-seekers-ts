# Development Plan: Issue #9 - Reference Generator

## Task Details

**Issue**: #9 - Reference Generator
**Branch**: feature/009-reference-generator
**Dependencies**: Issues #2 (schemas) and #3 (file system utils) are COMPLETE
**Worktree**: /Users/dennisonbertram/Develop/ModelContextProtocol/.worktrees-skill-seekers-ts/009-reference-generator

## Objective

Implement a reference generator that creates individual markdown reference files for each page. These files will be saved to `references/` directory and serve as the knowledge base for the skill.

## Success Criteria

- [ ] ReferenceGenerator class implemented
- [ ] generateReferences() creates markdown files for pages
- [ ] generateFilename() converts URLs to valid filenames
- [ ] generateReferenceContent() creates well-formatted markdown
- [ ] generateIndex() creates INDEX.md with file list
- [ ] generateAll() combines references + index generation
- [ ] Handles category subdirectories
- [ ] Deduplicates and limits links to 20
- [ ] All tests pass (20+ tests required)
- [ ] 80%+ test coverage
- [ ] npm run build succeeds
- [ ] npm run lint passes
- [ ] No type errors (strict mode)

## Feasibility Assessment

✅ **REAL IMPLEMENTATION READY**
- File system utilities already exist (src/utils/fs.ts)
- Page types and schemas already defined (src/types/page.ts)
- Logger utility available for tracking
- All dependencies are in place

✅ **NO EXTERNAL SERVICES REQUIRED**
- Pure file system operations
- Markdown generation from existing data structures
- No API calls or external dependencies needed

✅ **PRODUCTION READY**
- Real file I/O operations
- Proper error handling through existing utilities
- Type-safe implementation with Zod schemas
- Comprehensive test coverage with real files

## Dependencies Verification

✅ **Available Dependencies**:
- fs/promises (Node.js built-in)
- path (Node.js built-in)
- Page types from src/types/page.ts
- File system utilities from src/utils/fs.ts
- Logger from src/utils/logger.ts
- Vitest for testing

✅ **Required Infrastructure**:
- File system access: ✅ Available
- Test framework: ✅ Vitest configured
- TypeScript: ✅ Configured with strict mode

## TDD Methodology - RED-GREEN-REFACTOR Cycles

### Cycle 1: Filename Generation
- **RED**: Write failing tests for generateFilename()
- **GREEN**: Implement generateFilename() to pass tests
- **REFACTOR**: Optimize filename sanitization

### Cycle 2: Markdown Content Generation
- **RED**: Write failing tests for generateReferenceContent()
- **GREEN**: Implement generateReferenceContent() to pass tests
- **REFACTOR**: Improve markdown formatting

### Cycle 3: Reference File Creation
- **RED**: Write failing tests for generateReferences()
- **GREEN**: Implement generateReferences() to pass tests
- **REFACTOR**: Optimize file I/O operations

### Cycle 4: Index Generation
- **RED**: Write failing tests for generateIndex()
- **GREEN**: Implement generateIndex() to pass tests
- **REFACTOR**: Improve index formatting

### Cycle 5: Combined Operations
- **RED**: Write failing tests for generateAll()
- **GREEN**: Implement generateAll() to pass tests
- **REFACTOR**: Final cleanup and optimization

## Progress Tracking

### TDD Cycles
- [ ] Cycle 1: Filename Generation (RED-GREEN-REFACTOR)
- [ ] Cycle 2: Markdown Content (RED-GREEN-REFACTOR)
- [ ] Cycle 3: Reference Files (RED-GREEN-REFACTOR)
- [ ] Cycle 4: Index Generation (RED-GREEN-REFACTOR)
- [ ] Cycle 5: Combined Operations (RED-GREEN-REFACTOR)

### Overall Progress
- [x] Planning document created
- [ ] Test file created (with failing tests)
- [ ] Implementation file created
- [ ] All tests passing
- [ ] Coverage target met (80%+)
- [ ] Build passing
- [ ] Lint passing
- [ ] Code committed

## Edge Cases to Handle

1. **URL Variations**:
   - Root URL (/)
   - Deep nested paths (/a/b/c/d)
   - URLs with special characters
   - URLs with encoded characters

2. **Content Variations**:
   - Pages without markdown
   - Pages without code samples
   - Pages without links
   - Pages with many links (>20)
   - Duplicate links

3. **File System**:
   - Category subdirectories
   - Invalid filename characters

## Observed Issues

(Document any unrelated issues discovered during implementation)
