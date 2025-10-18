/**
 * CLI-friendly logger wrapper with emojis and colors
 * Provides user-friendly console output for CLI commands
 */

/**
 * ANSI color codes
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * CLI logger options
 */
export interface CliLoggerOptions {
  /** Suppress all output except forced errors */
  quiet?: boolean;
  /** Enable verbose/debug output */
  verbose?: boolean;
}

/**
 * CLI logger for user-friendly console output
 */
export class CliLogger {
  private quiet: boolean;
  private verbose: boolean;

  constructor(options: CliLoggerOptions = {}) {
    this.quiet = options.quiet ?? false;
    this.verbose = options.verbose ?? false;
  }

  /**
   * Output success message with checkmark
   */
  success(message: string): void {
    if (this.quiet) return;
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  }

  /**
   * Output error message with X mark
   */
  error(message: string, error?: Error, force = false): void {
    if (this.quiet && !force) return;

    const errorDetails = error ? `\n${colors.red}   ${error.message}${colors.reset}` : '';
    console.error(`${colors.red}❌ ${message}${errorDetails}${colors.reset}`);
  }

  /**
   * Output info message with info icon
   */
  info(message: string): void {
    if (this.quiet) return;
    console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
  }

  /**
   * Output warning message with warning icon
   */
  warning(message: string): void {
    if (this.quiet) return;
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  }

  /**
   * Output progress message with spinner
   */
  progress(message: string, current?: number, total?: number): void {
    if (this.quiet) return;

    let progressText = message;
    if (current !== undefined && total !== undefined) {
      const percentage = Math.round((current / total) * 100);
      progressText += ` (${current}/${total} - ${percentage}%)`;
    }

    console.log(`⏳ ${progressText}`);
  }

  /**
   * Output header with rocket icon
   */
  header(message: string): void {
    if (this.quiet) return;
    console.log(`${colors.bold}🚀 ${message}${colors.reset}`);
  }

  /**
   * Output summary with folder icon
   */
  summary(message: string): void {
    if (this.quiet) return;
    console.log(`📂 ${message}`);
  }

  /**
   * Output blank line
   */
  blank(): void {
    if (this.quiet) return;
    console.log('');
  }

  /**
   * Output list of items with bullets
   */
  list(items: string[]): void {
    if (this.quiet) return;
    items.forEach((item) => {
      console.log(`  • ${item}`);
    });
  }

  /**
   * Output debug message (only in verbose mode)
   */
  debug(message: string): void {
    if (this.quiet || !this.verbose) return;
    console.log(`${colors.blue}🐛 ${message}${colors.reset}`);
  }
}
