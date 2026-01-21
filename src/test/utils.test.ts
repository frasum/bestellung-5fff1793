import { describe, it, expect } from 'vitest';
import { cn, toTitleCase } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });

    it('handles undefined values', () => {
      expect(cn('base', undefined, 'end')).toBe('base end');
    });

    it('merges tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles empty input', () => {
      expect(cn()).toBe('');
    });

    it('handles array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });
  });

  describe('toTitleCase', () => {
    it('converts ALL CAPS to Title Case', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('converts single word ALL CAPS', () => {
      expect(toTitleCase('TEST')).toBe('Test');
    });

    it('leaves mixed case unchanged', () => {
      expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('leaves lowercase unchanged', () => {
      expect(toTitleCase('hello world')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('handles German umlauts in ALL CAPS', () => {
      expect(toTitleCase('KÄSE WÜRSTCHEN')).toBe('Käse Würstchen');
    });

    it('handles predominantly uppercase (>70%)', () => {
      expect(toTitleCase('HELLO world')).toBe('Hello World');
    });

    it('preserves text when less than 70% uppercase', () => {
      expect(toTitleCase('Hello WORLD')).toBe('Hello WORLD');
    });

    it('handles single character', () => {
      expect(toTitleCase('A')).toBe('A');
    });

    it('handles numbers mixed with text', () => {
      expect(toTitleCase('TEST123')).toBe('Test123');
    });
  });
});
