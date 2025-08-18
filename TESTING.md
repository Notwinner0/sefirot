# Testing Guide

## **Why Testing is Important**

Testing is crucial for maintaining code quality and ensuring your application works correctly. Here's why:

### **1. Bug Prevention**
- Catch issues before they reach production
- Identify edge cases you might not think of
- Prevent regressions when making changes

### **2. Code Confidence**
- Refactor with confidence knowing tests will catch issues
- Understand how your code should behave
- Document expected behavior

### **3. Development Speed**
- Faster debugging with isolated test cases
- Quick feedback on changes
- Easier onboarding for new developers

## **Testing Setup**

This project uses **Vitest** for testing, which provides:
- Fast execution
- Vue.js integration
- Coverage reporting
- Watch mode for development

### **Installation**

```bash
# Install dependencies (if not already done)
bun install

# Run tests
bun test

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch
```

## **Test Structure**

```
src/
├── components/
│   └── __tests__/
│       └── Desktop.test.ts
├── stores/
│   └── __tests__/
│       └── windows.test.ts
├── composables/
│   └── __tests__/
│       └── useFS.test.ts
└── test/
    └── setup.ts
```

## **Types of Tests**

### **1. Unit Tests**
Test individual functions and components in isolation.

**Example:**
```typescript
it('handles item selection correctly', async () => {
  const wrapper = mount(Desktop, {
    global: { plugins: [pinia] }
  })
  
  const item = wrapper.find('[data-item-path]')
  await item.trigger('click')
  
  expect(wrapper.vm.selectedItems.size).toBe(1)
})
```

### **2. Integration Tests**
Test how components work together.

**Example:**
```typescript
it('opens File Explorer from desktop', async () => {
  const wrapper = mount(Desktop, {
    global: { plugins: [pinia] }
  })
  
  const explorerItem = wrapper.find('[data-item-path*="File Explorer"]')
  await explorerItem.trigger('dblclick')
  
  expect(windows.openApp).toHaveBeenCalledWith(
    'File Explorer', 
    { type: 'component', name: 'FileExplorer' }
  )
})
```

### **3. Store Tests**
Test Pinia store logic.

**Example:**
```typescript
it('updates window position correctly', () => {
  const store = useWindowsStore()
  
  store.openApp('Test App', { type: 'component', name: 'TestComponent' })
  const windowId = store.windows[0].id
  
  store.updateWindowPosition(windowId, 100, 200)
  
  expect(store.windows[0].x).toBe(100)
  expect(store.windows[0].y).toBe(200)
})
```

## **Testing Best Practices**

### **1. Test Organization**
```typescript
describe('Component Name', () => {
  // Setup
  beforeEach(() => {
    // Initialize test environment
  })

  // Happy path tests
  it('should work correctly with valid input', () => {
    // Test normal operation
  })

  // Edge cases
  it('should handle empty state', () => {
    // Test edge cases
  })

  // Error cases
  it('should handle errors gracefully', () => {
    // Test error handling
  })
})
```

### **2. Mocking**
Mock external dependencies to isolate what you're testing.

```typescript
// Mock composables
vi.mock('../../composables/useFS', () => ({
  useWindowsFS: () => ({
    initializeDrive: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([])
  })
}))

// Mock browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn()
  }
})
```

### **3. Assertions**
Use descriptive assertions that clearly state what you're testing.

```typescript
// Good
expect(wrapper.vm.selectedItems.size).toBe(1)
expect(store.windows[0].title).toBe('Test App')

// Better
expect(wrapper.vm.selectedItems.size).toBe(1, 'Should select exactly one item')
expect(store.windows[0].title).toBe('Test App', 'Window should have correct title')
```

## **Running Tests**

### **Development Workflow**
```bash
# Run tests in watch mode during development
bun test:watch

# Run specific test file
bun test Desktop.test.ts

# Run tests matching a pattern
bun test --grep "selection"
```

### **Coverage Reports**
```bash
# Generate coverage report
bun test:coverage

# View coverage in browser
open coverage/index.html
```

### **Continuous Integration**
Tests should run automatically on:
- Pull requests
- Code pushes
- Before deployment

## **Common Testing Patterns**

### **1. Component Testing**
```typescript
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

describe('MyComponent', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      global: { plugins: [pinia] }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})
```

### **2. Async Testing**
```typescript
it('loads data asynchronously', async () => {
  const wrapper = mount(MyComponent)
  
  // Wait for async operations
  await wrapper.vm.$nextTick()
  
  expect(wrapper.vm.data).toBeDefined()
})
```

### **3. Event Testing**
```typescript
it('handles user interactions', async () => {
  const wrapper = mount(MyComponent)
  
  await wrapper.find('button').trigger('click')
  
  expect(wrapper.emitted('click')).toBeTruthy()
})
```

## **Debugging Tests**

### **1. Console Output**
```typescript
it('debug test', () => {
  console.log('Debug info:', someValue)
  expect(true).toBe(true)
})
```

### **2. Test UI**
```bash
bun test:ui
```
Opens a browser interface for debugging tests.

### **3. Breakpoints**
Use `debugger` statement in tests:
```typescript
it('debug with breakpoint', () => {
  debugger
  expect(true).toBe(true)
})
```

## **Test Maintenance**

### **1. Keep Tests Simple**
- One assertion per test when possible
- Clear test names that describe the behavior
- Avoid complex setup

### **2. Update Tests with Code**
- When you change functionality, update tests
- Don't let tests become outdated
- Use tests to guide refactoring

### **3. Regular Review**
- Review test coverage regularly
- Remove obsolete tests
- Refactor tests when they become complex

## **Next Steps**

1. **Run the existing tests**: `bun test`
2. **Add tests for new features** as you develop them
3. **Improve coverage** by adding tests for edge cases
4. **Set up CI/CD** to run tests automatically
5. **Use test-driven development** for complex features

Remember: **Good tests are an investment in your code's future!**


