import { beforeAll } from 'bun:test';
import { config } from '@vue/test-utils';
import { createPinia } from 'pinia';

// Configure Vue Test Utils
config.global.plugins = [createPinia()];

// Mock window methods for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Set up test environment
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
});
