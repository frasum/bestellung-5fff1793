import { describe, it, expect, vi } from "vitest";
import { getErrorMessage, hasErrorCode, handleError } from "./errorUtils";

describe("errorUtils", () => {
  describe("getErrorMessage", () => {
    it("should extract message from Error object", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("should return string as-is", () => {
      expect(getErrorMessage("Simple string error")).toBe("Simple string error");
    });

    it("should extract message from object with message property", () => {
      const error = { message: "Object error message" };
      expect(getErrorMessage(error)).toBe("Object error message");
    });

    it("should return fallback for unknown objects", () => {
      const error = { code: 123, details: "some details" };
      expect(getErrorMessage(error)).toBe("Ein unbekannter Fehler ist aufgetreten");
    });

    it("should return fallback for null", () => {
      expect(getErrorMessage(null)).toBe("Ein unbekannter Fehler ist aufgetreten");
    });

    it("should return fallback for undefined", () => {
      expect(getErrorMessage(undefined)).toBe("Ein unbekannter Fehler ist aufgetreten");
    });
  });

  describe("hasErrorCode", () => {
    it("should detect error code in Error with code property", () => {
      const error = Object.assign(new Error("DB Error"), { code: "23505" });
      expect(hasErrorCode(error, "23505")).toBe(true);
    });

    it("should return false for non-matching code", () => {
      const error = Object.assign(new Error("DB Error"), { code: "23505" });
      expect(hasErrorCode(error, "42P01")).toBe(false);
    });

    it("should handle objects with code property", () => {
      const error = { code: "PGRST116", message: "Not found" };
      expect(hasErrorCode(error, "PGRST116")).toBe(true);
    });

    it("should return false for errors without code", () => {
      const error = new Error("No code");
      expect(hasErrorCode(error, "23505")).toBe(false);
    });

    it("should handle null/undefined", () => {
      expect(hasErrorCode(null, "23505")).toBe(false);
      expect(hasErrorCode(undefined, "23505")).toBe(false);
    });
  });

  describe("handleError", () => {
    it("should log error with context", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Test error");
      
      handleError(error, "TestContext");
      
      expect(consoleSpy).toHaveBeenCalledWith("[TestContext]", error);
      consoleSpy.mockRestore();
    });

    it("should log error without context", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Test error");
      
      handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });

    it("should return the error message", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Return test");
      
      const result = handleError(error);
      
      expect(result).toBe("Return test");
      vi.restoreAllMocks();
    });
  });
});
