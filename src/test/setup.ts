import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for components that use it
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver for lazy loading components
window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  root: null,
  rootMargin: "",
  thresholds: [],
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
})) as unknown as typeof IntersectionObserver;
