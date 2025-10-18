/**
 * Main entry point for skill-seekers-ts
 */

// Export all public APIs
export * from './types';
export * from './utils';
export * from './core';

// Re-export main builder for convenience
export { SkillBuilder } from './core/builder/skill-builder';
export type { BuildResult } from './core/builder/skill-builder';