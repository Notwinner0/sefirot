import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWindowsStore } from '../windows'

describe('Windows Store', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('initializes with empty windows', () => {
    const store = useWindowsStore()
    expect(store.windows).toEqual([])
  })

  it('opens a new window correctly', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    
    expect(store.windows.length).toBe(1)
    expect(store.windows[0].title).toBe('Test App')
    expect(store.windows[0].content).toEqual({ type: 'component', name: 'TestComponent' })
  })

  it('assigns unique IDs to windows', () => {
    const store = useWindowsStore()
    
    store.openApp('App 1', { type: 'component', name: 'Component1' })
    store.openApp('App 2', { type: 'component', name: 'Component2' })
    
    expect(store.windows.length).toBe(2)
    expect(store.windows[0].id).not.toBe(store.windows[1].id)
  })

  it('updates window position correctly', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    const windowId = store.windows[0].id
    
    store.updateWindowPosition(windowId, 100, 200)
    
    expect(store.windows[0].x).toBe(100)
    expect(store.windows[0].y).toBe(200)
  })

  it('updates window size correctly', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    const windowId = store.windows[0].id
    
    store.updateWindowSize(windowId, 800, 600)
    
    expect(store.windows[0].width).toBe(800)
    expect(store.windows[0].height).toBe(600)
  })

  it('minimizes window correctly', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    const windowId = store.windows[0].id
    
    store.minimizeWindow(windowId)
    
    expect(store.windows[0].isMinimized).toBe(true)
  })

  it('maximizes window correctly', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    const windowId = store.windows[0].id
    
    store.maximizeWindow(windowId)
    
    expect(store.windows[0].isMaximized).toBe(true)
  })

  it('restores window correctly', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    const windowId = store.windows[0].id
    
    // First maximize
    store.maximizeWindow(windowId)
    expect(store.windows[0].isMaximized).toBe(true)
    
    // Then restore
    store.restoreWindow(windowId)
    expect(store.windows[0].isMaximized).toBe(false)
  })

  it('persists window positions', () => {
    const store = useWindowsStore()
    
    store.openApp('Test App', { type: 'component', name: 'TestComponent' })
    const windowId = store.windows[0].id
    
    store.updateWindowPosition(windowId, 150, 250)
    
    expect(store.windows[0].x).toBe(150)
    expect(store.windows[0].y).toBe(250)
  })
})
