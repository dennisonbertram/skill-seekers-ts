import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  ensureDir,
  writeFile,
  readFile,
  exists,
  remove,
  listFiles,
  readJsonFile,
  writeJsonFile,
  FileSystemError,
} from '../../src/utils/fs';

const TEST_DIR = path.join(process.cwd(), 'test-temp');

describe('File System Utilities', () => {
  beforeEach(async () => {
    // Clean up before each test
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('FileSystemError', () => {
    it('should create FileSystemError with correct properties', () => {
      const error = new FileSystemError('Test error', 'testOp', '/test/path');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.operation).toBe('testOp');
      expect(error.filePath).toBe('/test/path');
      expect(error.name).toBe('FileSystemError');
    });
  });

  describe('ensureDir', () => {
    it('should create a directory that does not exist', async () => {
      const dirPath = path.join(TEST_DIR, 'new-dir');
      await ensureDir(dirPath);
      const dirExists = await exists(dirPath);
      expect(dirExists).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const dirPath = path.join(TEST_DIR, 'existing-dir');
      await fs.mkdir(dirPath, { recursive: true });
      await expect(ensureDir(dirPath)).resolves.toBeUndefined();
    });

    it('should create nested directories', async () => {
      const dirPath = path.join(TEST_DIR, 'level1', 'level2', 'level3');
      await ensureDir(dirPath);
      const dirExists = await exists(dirPath);
      expect(dirExists).toBe(true);
    });
  });

  describe('writeFile and readFile', () => {
    it('should write and read a file', async () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      const content = 'Hello, World!';
      await writeFile(filePath, content);
      const readContent = await readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should create parent directories when writing', async () => {
      const filePath = path.join(TEST_DIR, 'nested', 'dirs', 'file.txt');
      await writeFile(filePath, 'content');
      const fileExists = await exists(filePath);
      expect(fileExists).toBe(true);
    });

    it('should throw FileSystemError when reading non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.txt');
      await expect(readFile(filePath)).rejects.toThrow(FileSystemError);
    });

    it('should overwrite existing file', async () => {
      const filePath = path.join(TEST_DIR, 'overwrite.txt');
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(filePath, 'old content');
      await writeFile(filePath, 'new content');
      const content = await readFile(filePath);
      expect(content).toBe('new content');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(TEST_DIR, 'exists.txt');
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(filePath, 'content');
      const result = await exists(filePath);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'does-not-exist.txt');
      const result = await exists(filePath);
      expect(result).toBe(false);
    });

    it('should return true for existing directory', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      const result = await exists(TEST_DIR);
      expect(result).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove a file', async () => {
      const filePath = path.join(TEST_DIR, 'to-remove.txt');
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(filePath, 'content');
      await remove(filePath);
      const fileExists = await exists(filePath);
      expect(fileExists).toBe(false);
    });

    it('should remove a directory recursively', async () => {
      const dirPath = path.join(TEST_DIR, 'to-remove-dir');
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(path.join(dirPath, 'file.txt'), 'content');
      await remove(dirPath);
      const dirExists = await exists(dirPath);
      expect(dirExists).toBe(false);
    });

    it('should throw FileSystemError when removing non-existent path', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.txt');
      await expect(remove(filePath)).rejects.toThrow(FileSystemError);
    });
  });

  describe('listFiles', () => {
    it('should list all files in a directory', async () => {
      const dirPath = TEST_DIR;
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(path.join(dirPath, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(dirPath, 'file2.txt'), 'content2');
      await fs.mkdir(path.join(dirPath, 'subdir'));

      const files = await listFiles(dirPath);
      expect(files).toHaveLength(2);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).not.toContain('subdir');
    });

    it('should return empty array for empty directory', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      const files = await listFiles(TEST_DIR);
      expect(files).toEqual([]);
    });

    it('should throw FileSystemError for non-existent directory', async () => {
      const dirPath = path.join(TEST_DIR, 'non-existent');
      await expect(listFiles(dirPath)).rejects.toThrow(FileSystemError);
    });
  });

  describe('readJsonFile and writeJsonFile', () => {
    it('should write and read JSON data', async () => {
      const filePath = path.join(TEST_DIR, 'data.json');
      const data = { name: 'Test', value: 42, nested: { key: 'value' } };
      await writeJsonFile(filePath, data);
      const readData = await readJsonFile(filePath);
      expect(readData).toEqual(data);
    });

    it('should throw error for invalid JSON', async () => {
      const filePath = path.join(TEST_DIR, 'invalid.json');
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(filePath, 'not valid json');
      await expect(readJsonFile(filePath)).rejects.toThrow(FileSystemError);
    });

    it('should format JSON with proper indentation', async () => {
      const filePath = path.join(TEST_DIR, 'formatted.json');
      const data = { key: 'value' };
      await writeJsonFile(filePath, data);
      const content = await readFile(filePath);
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });

    it('should handle arrays in JSON', async () => {
      const filePath = path.join(TEST_DIR, 'array.json');
      const data = [1, 2, 3, { nested: true }];
      await writeJsonFile(filePath, data);
      const readData = await readJsonFile(filePath);
      expect(readData).toEqual(data);
    });

    it('should throw FileSystemError for non-existent JSON file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.json');
      await expect(readJsonFile(filePath)).rejects.toThrow(FileSystemError);
    });
  });
});