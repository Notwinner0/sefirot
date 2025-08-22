import { defineStore } from "pinia";

type WindowContent =
  | { type: "iframe"; src: string }
  | { type: "component"; name: string; props?: Record<string, any> };

interface Window {
  id: string;
  title: string;
  content: WindowContent;
  x: number;
  y: number;
  width?: number;
  height?: number;
  isMinimized: boolean;
  isMaximized: boolean;
  originalPosition?: { x: number; y: number; width?: number; height?: number };
  zIndex: number;
}

export const useWindowsStore = defineStore("windows", {
  state: () => ({
    windows: [] as Window[],
    windowPositions: {} as Record<string, { x: number; y: number; width?: number; height?: number }>
  }),
  actions: {
    openApp(title: string, content: WindowContent) {
      // Get saved position for this app type, or use default
      const appKey = this.getAppKey(title, content);
      const savedPosition = this.windowPositions[appKey] || { x: 80, y: 80 };
      
      // Calculate the next zIndex
      const maxZIndex = this.windows.length > 0 ? Math.max(...this.windows.map(w => w.zIndex)) : 0;
      
      this.windows.push({
        id: Date.now().toString(),
        title,
        content,
        x: savedPosition.x,
        y: savedPosition.y,
        width: savedPosition.width,
        height: savedPosition.height,
        isMinimized: false,
        isMaximized: false,
        zIndex: maxZIndex + 1
      });
    },
    closeApp(id: string) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        // Save position before closing
        const appKey = this.getAppKey(window.title, window.content);
        this.windowPositions[appKey] = {
          x: window.x,
          y: window.y,
          width: window.width,
          height: window.height
        };
        this.savePositions();
      }
      this.windows = this.windows.filter(w => w.id !== id);
    },
    updateWindowPosition(id: string, x: number, y: number) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        window.x = x;
        window.y = y;
      }
    },
    updateWindowSize(id: string, width: number, height: number) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        window.width = width;
        window.height = height;
      }
    },
    minimizeWindow(id: string) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        window.isMinimized = true;
      }
    },
    maximizeWindow(id: string) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        if (window.isMaximized) {
          // Restore
          if (window.originalPosition) {
            window.x = window.originalPosition.x;
            window.y = window.originalPosition.y;
            window.width = window.originalPosition.width;
            window.height = window.originalPosition.height;
          }
          window.isMaximized = false;
        } else {
          // Maximize
          window.originalPosition = {
            x: window.x,
            y: window.y,
            width: window.width,
            height: window.height
          };
          window.x = 0;
          window.y = 0;
          window.width = globalThis.window.innerWidth;
          window.height = globalThis.window.innerHeight;
          window.isMaximized = true;
        }
      }
    },
    restoreWindow(id: string) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        window.isMinimized = false;
      }
    },
    minimizeAll() {
      this.windows.forEach(w => {
        w.isMinimized = true;
      });
    },
    focusWindow(id: string) {
      const window = this.windows.find(w => w.id === id);
      if (window) {
        // Find the current maximum zIndex
        const maxZIndex = Math.max(...this.windows.map(w => w.zIndex));
        window.zIndex = maxZIndex + 1;
      }
    },
    getAppKey(title: string, content: WindowContent): string {
      if (content.type === 'iframe') {
        return `iframe-${content.src}`;
      } else {
        // Include initialPath in the key for FileExplorer to distinguish instances
        if (content.name === 'FileExplorer' && content.props && content.props.initialPath) {
          return `component-${content.name}-${content.props.initialPath}`;
        }
        return `component-${content.name}`;
      }
    },
    savePositions() {
      localStorage.setItem('windowPositions', JSON.stringify(this.windowPositions));
    },
    loadPositions() {
      const saved = localStorage.getItem('windowPositions');
      if (saved) {
        this.windowPositions = JSON.parse(saved);
      }
    }
  }
});
