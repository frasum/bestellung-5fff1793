import { describe, it, expect, vi } from 'vitest';
import { getErrorMessage, hasErrorCode, handleError } from '@/lib/errorUtils';

describe('errorUtils', () => {
  describe('getErrorMessage', () => {
    it('extracts message from Error object', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('returns string errors as-is', () => {
      expect(getErrorMessage('Simple string error')).toBe('Simple string error');
    });

    it('extracts message from object with message property', () => {
      const error = { message: 'Object error message' };
      expect(getErrorMessage(error)).toBe('Object error message');
    });

    it('returns default message for null', () => {
      expect(getErrorMessage(null)).toBe('Ein unbekannter Fehler ist aufgetreten');
    });

    it('returns default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Ein unbekannter Fehler ist aufgetreten');
    });

    it('returns default message for number', () => {
      expect(getErrorMessage(42)).toBe('Ein unbekannter Fehler ist aufgetreten');
    });

    it('returns default message for object without message', () => {
      expect(getErrorMessage({ code: 'ERR' })).toBe('Ein unbekannter Fehler ist aufgetreten');
    });

    it('handles Supabase-style errors', () => {
      const supabaseError = { message: 'Row not found', code: 'PGRST116' };
      expect(getErrorMessage(supabaseError)).toBe('Row not found');
    });
  });

  describe('hasErrorCode', () => {
    it('returns true when error has matching code', () => {
      const error = { code: 'PGRST116', message: 'Not found' };
      expect(hasErrorCode(error, 'PGRST116')).toBe(true);
    });

    it('returns false when code does not match', () => {
      const error = { code: 'PGRST116', message: 'Not found' };
      expect(hasErrorCode(error, 'DIFFERENT')).toBe(false);
    });

    it('returns false for null', () => {
      expect(hasErrorCode(null, 'ANY')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasErrorCode(undefined, 'ANY')).toBe(false);
    });

    it('returns false for object without code', () => {
      expect(hasErrorCode({ message: 'Error' }, 'ANY')).toBe(false);
    });

    it('returns false for string', () => {
      expect(hasErrorCode('error string', 'ANY')).toBe(false);
    });
  });

  describe('handleError', () => {
    it('logs error and returns message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      
      const result = handleError(error);
      
      expect(result).toBe('Test error');
      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });

    it('includes context in log when provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      
      const result = handleError(error, 'TestContext');
      
      expect(result).toBe('Test error');
      expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', error);
      consoleSpy.mockRestore();
    });

    it('handles unknown error types', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = handleError(42, 'NumberError');
      
      expect(result).toBe('Ein unbekannter Fehler ist aufgetreten');
      expect(consoleSpy).toHaveBeenCalledWith('[NumberError]', 42);
      consoleSpy.mockRestore();
    });
  });
});
