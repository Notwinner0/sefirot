import { config } from '@vue/test-utils'

// Global test configuration
config.global.stubs = {
  // Stub components that might cause issues in tests
  'router-link': true,
  'router-view': true
}

// Mock window properties for tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080
})

// Mock globalThis.window
Object.defineProperty(globalThis, 'window', {
  writable: true,
  configurable: true,
  value: window
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  writable: true,
  configurable: true,
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
})
