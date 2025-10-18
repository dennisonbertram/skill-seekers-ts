/**
 * File system utility functions for managing files and directories
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger';

/**
 * Custom error class for file system operations
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public operation: string,
    public filePath: string,
  ) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`Ensured directory exists: ${dirPath}`);
  } catch (error) {
    throw new FileSystemError(
      `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ensureDir',
      dirPath,
    );
  }
}

/**
 * Write content to a file, creating parent directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await ensureDir(dir);
    await fs.writeFile(filePath, content, 'utf-8');
    logger.debug(`Wrote file: ${filePath}`);
  } catch (error) {
    throw new FileSystemError(
      `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'writeFile',
      filePath,
    );
  }
}

/**
 * Read file content as string
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    logger.debug(`Read file: ${filePath}`);
    return content;
  } catch (error) {
    throw new FileSystemError(
      `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'readFile',
      filePath,
    );
  }
}

/**
 * Check if a file or directory exists
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a file or directory recursively
 */
export async function remove(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    logger.debug(`Removed: ${filePath}`);
  } catch (error) {
    throw new FileSystemError(
      `Failed to remove: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'remove',
      filePath,
    );
  }
}

/**
 * List all files in a directory (non-recursive)
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    throw new FileSystemError(
      `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'listFiles',
      dirPath,
    );
  }
}

/**
 * Read JSON file and parse it
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await readFile(filePath);
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'readJsonFile',
      filePath,
    );
  }
}

/**
 * Write object to JSON file
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await writeFile(filePath, content);
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      `Failed to stringify JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'writeJsonFile',
      filePath,
    );
  }
}