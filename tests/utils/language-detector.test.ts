import { describe, it, expect } from 'vitest';
import { LanguageDetector } from '../../src/utils/language-detector';

describe('LanguageDetector', () => {
  const detector = new LanguageDetector();

  describe('detectFromCode', () => {
    it('should detect Python from import statements', () => {
      const code = 'import sys\nfrom pathlib import Path';
      expect(detector.detectFromCode(code)).toBe('python');
    });

    it('should detect Python from function definitions', () => {
      const code = 'def hello_world():\n    print("hello")';
      expect(detector.detectFromCode(code)).toBe('python');
    });

    it('should detect JavaScript from import statements', () => {
      const code = 'import React from "react";\nconst App = () => {};';
      expect(detector.detectFromCode(code)).toBe('javascript');
    });

    it('should detect TypeScript from type annotations', () => {
      const code = 'const name: string = "test";\ninterface User {}';
      expect(detector.detectFromCode(code)).toBe('typescript');
    });

    it('should detect GDScript from extends keyword', () => {
      const code = 'extends Node2D\nfunc _ready():\n    pass';
      expect(detector.detectFromCode(code)).toBe('gdscript');
    });

    it('should return plaintext for unknown code', () => {
      const code = 'just some random text';
      expect(detector.detectFromCode(code)).toBe('plaintext');
    });
  });

  describe('detectFromFilename', () => {
    it('should detect language from .py extension', () => {
      expect(detector.detectFromFilename('script.py')).toBe('python');
    });

    it('should detect language from .js extension', () => {
      expect(detector.detectFromFilename('app.js')).toBe('javascript');
    });

    it('should detect language from .ts extension', () => {
      expect(detector.detectFromFilename('types.ts')).toBe('typescript');
    });

    it('should return null for unknown extension', () => {
      expect(detector.detectFromFilename('file.xyz')).toBeNull();
    });

    it('should return null for files without extension', () => {
      expect(detector.detectFromFilename('README')).toBeNull();
    });
  });
});