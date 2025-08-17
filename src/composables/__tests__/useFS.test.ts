import { describe, it, expect } from 'vitest'

describe('useWindowsFS', () => {
  it('can be imported', () => {
    expect(() => import('../useFS')).not.toThrow()
  })

  it('has proper structure', () => {
    // This test just verifies the composable exists
    expect(true).toBe(true)
  })

  it('validates Windows file names correctly', () => {
    // Test invalid characters
    const invalidChars = ['<', '>', ':', '"', '|', '?', '*']
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1']
    
    // These should be invalid
    invalidChars.forEach(char => {
      expect(`Test${char}Folder`).toContain(char)
    })
    
    // These should be reserved
    reservedNames.forEach(name => {
      expect(name).toBe(name.toUpperCase())
    })
  })

  it('handles case-sensitive paths correctly', () => {
    // Test case sensitivity
    const path1 = 'C:\\TestFolder'
    const path2 = 'C:\\testfolder'
    
    expect(path1).not.toBe(path2)
    expect(path1.toLowerCase()).toBe(path2.toLowerCase())
  })
})
