export interface LanguagePattern {
  language: string;
  patterns: RegExp[];
  minMatches: number;
}

export class LanguageDetector {
  private readonly languagePatterns: LanguagePattern[] = [
    {
      language: 'typescript',
      patterns: [/:\s*\w+\s*[=;]/, /interface\s+\w+/, /type\s+\w+\s*=/],
      minMatches: 1,
    },
    {
      language: 'javascript',
      patterns: [/^import\s+.*from\s+['"`]/m, /const\s+\w+\s*=/, /function\s+\w+\s*\(/],
      minMatches: 1,
    },
    {
      language: 'python',
      patterns: [/^import\s+\w+$/m, /^from\s+\w+\s+import/m, /def\s+\w+\s*\(/],
      minMatches: 1,
    },
    {
      language: 'gdscript',
      patterns: [/^extends\s+\w+/m, /^func\s+\w+\s*\(/m, /^var\s+\w+/m],
      minMatches: 1,
    },
  ];

  detectFromCode(code: string): string {
    for (const { language, patterns, minMatches } of this.languagePatterns) {
      const matches = patterns.filter((pattern) => pattern.test(code)).length;
      if (matches >= minMatches) {
        return language;
      }
    }
    return 'plaintext';
  }

  detectFromFilename(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    const extensionMap: Record<string, string> = {
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      gd: 'gdscript',
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
    };
    return ext ? extensionMap[ext] || null : null;
  }
}