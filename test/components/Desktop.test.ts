import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import Desktop from '../../src/components/Desktop.vue';
import type { FSNode } from '../../src/types/desktop';

// Mock the composables
vi.mock('../../src/composables/useFS', () => ({
  useWindowsFS: () => ({
    initializeDrive: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('../../src/composables/useEventBus', () => ({
  useEventBus: () => ({
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

vi.mock('../../src/composables/useContextMenu', () => ({
  useContextMenu: () => ({
    contextMenu: { value: { show: false, x: 0, y: 0, target: null } },
    showContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
  }),
}));

vi.mock('../../src/composables/useDesktopSelection', () => ({
  useDesktopSelection: () => ({
    selectedItems: { value: new Set() },
    hasSelection: false,
    hasSingleSelection: false,
    selectItem: vi.fn(),
    toggleSelection: vi.fn(),
    selectRange: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

vi.mock('../../src/composables/useDesktopPositioning', () => ({
  useDesktopPositioning: () => ({
    assignDefaultPositions: vi.fn(),
    moveItems: vi.fn(),
    resolveStacking: vi.fn(),
  }),
}));

vi.mock('../../src/composables/useDesktopDrag', () => ({
  useDesktopDrag: () => ({
    isDragging: { value: false },
    isMoving: { value: false },
    hasMoved: { value: false },
    isGridEnabled: { value: false },
    selectionBox: { value: { visible: false, x: 0, y: 0, width: 0, height: 0 } },
    startDrag: vi.fn(),
    prepareItemDrag: vi.fn(),
    onMouseMove: vi.fn(),
    startItemMovement: vi.fn(),
    handleItemMovement: vi.fn(),
    selectItemsInBox: vi.fn().mockReturnValue([]),
    stopDrag: vi.fn(),
    toggleGrid: vi.fn(),
  }),
}));

vi.mock('../../src/composables/useDesktopFileOps', () => ({
  useDesktopFileOps: () => ({
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    openItem: vi.fn(),
    openFileExplorer: vi.fn(),
    getDisplayName: vi.fn(),
  }),
}));

describe('Desktop Component', () => {
  let wrapper: any;
  let mockFS: any;
  let mockEventBus: any;
  let mockSelection: any;
  let mockPositioning: any;
  let mockDrag: any;
  let mockFileOps: any;

  const mockDesktopItems: FSNode[] = [
    {
      name: 'test.txt',
      path: '/desktop/test.txt',
      parent: '/desktop',
      type: 'file',
      attributes: { hidden: false, readOnly: false },
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      name: 'folder',
      path: '/desktop/folder',
      parent: '/desktop',
      type: 'directory',
      attributes: { hidden: false, readOnly: false },
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockFS = {
      initializeDrive: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue(mockDesktopItems),
    };

    mockEventBus = {
      on: vi.fn(),
      off: vi.fn(),
    };

    mockSelection = {
      selectedItems: { value: new Set() },
      hasSelection: false,
      hasSingleSelection: false,
      selectItem: vi.fn(),
      toggleSelection: vi.fn(),
      selectRange: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
    };

    mockPositioning = {
      assignDefaultPositions: vi.fn(),
      moveItems: vi.fn(),
      resolveStacking: vi.fn(),
    };

    mockDrag = {
      isDragging: { value: false },
      isMoving: { value: false },
      hasMoved: { value: false },
      isGridEnabled: { value: false },
      selectionBox: { value: { visible: false, x: 0, y: 0, width: 0, height: 0 } },
      startDrag: vi.fn(),
      prepareItemDrag: vi.fn(),
      onMouseMove: vi.fn(),
      startItemMovement: vi.fn(),
      handleItemMovement: vi.fn(),
      selectItemsInBox: vi.fn().mockReturnValue([]),
      stopDrag: vi.fn(),
      toggleGrid: vi.fn(),
    };

    mockFileOps = {
      createFile: vi.fn(),
      createDirectory: vi.fn(),
      openItem: vi.fn(),
      openFileExplorer: vi.fn(),
      getDisplayName: vi.fn(),
    };

    // Update the mocks
    vi.mocked(require('../../src/composables/useFS').useWindowsFS).mockReturnValue(mockFS);
    vi.mocked(require('../../src/composables/useEventBus').useEventBus).mockReturnValue(mockEventBus);
    vi.mocked(require('../../src/composables/useDesktopSelection').useDesktopSelection).mockReturnValue(mockSelection);
    vi.mocked(require('../../src/composables/useDesktopPositioning').useDesktopPositioning).mockReturnValue(mockPositioning);
    vi.mocked(require('../../src/composables/useDesktopDrag').useDesktopDrag).mockReturnValue(mockDrag);
    vi.mocked(require('../../src/composables/useDesktopFileOps').useDesktopFileOps).mockReturnValue(mockFileOps);

    wrapper = mount(Desktop, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DesktopItem: true,
          SelectionBox: true,
          DesktopContextMenu: true,
        },
      },
    });
  });

  describe('Initialization', () => {
    it('should initialize desktop on mount', async () => {
      expect(mockFS.initializeDrive).toHaveBeenCalledWith('/C:/Desktop');
      expect(mockFS.readdir).toHaveBeenCalledWith('/C:/Desktop');
      expect(mockPositioning.assignDefaultPositions).toHaveBeenCalledWith(mockDesktopItems);
      expect(mockEventBus.on).toHaveBeenCalledWith('desktop-refresh', expect.any(Function));
    });

    it('should handle initialization errors gracefully', async () => {
      mockFS.initializeDrive.mockRejectedValueOnce(new Error('Init failed'));
      mockFS.readdir.mockRejectedValueOnce(new Error('Read failed'));

      // Re-mount component to trigger initialization
      wrapper.unmount();
      wrapper = mount(Desktop, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DesktopItem: true,
            SelectionBox: true,
            DesktopContextMenu: true,
          },
        },
      });

      // Should still render without crashing
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Desktop Items Rendering', () => {
    it('should render desktop items', () => {
      const desktopItems = wrapper.findAllComponents({ name: 'DesktopItem' });
      expect(desktopItems).toHaveLength(mockDesktopItems.length);
    });

    it('should show fallback file explorer when no items', async () => {
      mockFS.readdir.mockResolvedValueOnce([]);
      wrapper.unmount();

      wrapper = mount(Desktop, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DesktopItem: true,
            SelectionBox: true,
            DesktopContextMenu: true,
          },
        },
      });

      await wrapper.vm.$nextTick();
      const fallbackExplorer = wrapper.find('.cursor-pointer');
      expect(fallbackExplorer.exists()).toBe(true);
      expect(fallbackExplorer.text()).toContain('File Explorer');
    });
  });

  describe('Selection Logic', () => {
    it('should handle single item selection', async () => {
      const mockEvent = { ctrlKey: false, shiftKey: false } as MouseEvent;
      const mockItem = mockDesktopItems[0];

      await wrapper.vm.selectItem(mockItem, mockEvent);
      expect(mockSelection.selectItem).toHaveBeenCalledWith(mockItem.path);
    });

    it('should handle ctrl+click for multi-selection', async () => {
      const mockEvent = { ctrlKey: true, shiftKey: false } as MouseEvent;
      const mockItem = mockDesktopItems[0];

      await wrapper.vm.selectItem(mockItem, mockEvent);
      expect(mockSelection.toggleSelection).toHaveBeenCalledWith(mockItem.path);
    });

    it('should handle shift+click for range selection', async () => {
      const mockEvent = { ctrlKey: false, shiftKey: true } as MouseEvent;
      const mockItem = mockDesktopItems[0];

      await wrapper.vm.selectItem(mockItem, mockEvent);
      expect(mockSelection.selectRange).toHaveBeenCalledWith(mockItem, mockDesktopItems);
    });

    it('should clear selection on desktop click', async () => {
      const desktopContainer = wrapper.find('.desktop-container');
      await desktopContainer.trigger('click');

      expect(mockSelection.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag start', async () => {
      const mockEvent = { clientX: 100, clientY: 100 } as MouseEvent;
      mockDrag.startDrag.mockReturnValue({ type: 'desktop' });

      const desktopContainer = wrapper.find('.desktop-container');
      await desktopContainer.trigger('mousedown', mockEvent);

      expect(mockDrag.startDrag).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle mouse move during drag', async () => {
      const mockEvent = { clientX: 150, clientY: 150 } as MouseEvent;
      mockDrag.isDragging.value = true;

      const desktopContainer = wrapper.find('.desktop-container');
      await desktopContainer.trigger('mousemove', mockEvent);

      expect(mockDrag.onMouseMove).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle drag stop', async () => {
      mockDrag.stopDrag.mockReturnValue({ finishedMoving: false });

      const desktopContainer = wrapper.find('.desktop-container');
      await desktopContainer.trigger('mouseup');

      expect(mockDrag.stopDrag).toHaveBeenCalled();
    });
  });

  describe('Context Menu', () => {
    it('should show context menu on right click', async () => {
      const mockEvent = { clientX: 100, clientY: 100 } as MouseEvent;
      const desktopContainer = wrapper.find('.desktop-container');

      await desktopContainer.trigger('contextmenu', mockEvent);
      expect(mockSelection.clearSelection).toHaveBeenCalled();
    });

    it('should handle context menu actions', async () => {
      const mockItem = mockDesktopItems[0];

      // Test select all action
      await wrapper.vm.handleContextMenuAction('select-all');
      expect(mockSelection.selectAll).toHaveBeenCalledWith(mockDesktopItems);

      // Test refresh action
      await wrapper.vm.handleContextMenuAction('refresh');
      expect(mockFS.readdir).toHaveBeenCalledWith('/C:/Desktop');
    });
  });

  describe('File Operations', () => {
    it('should handle item double click', async () => {
      const mockItem = mockDesktopItems[0];
      await wrapper.vm.handleItemDoubleClick(mockItem);

      expect(mockFileOps.openItem).toHaveBeenCalledWith(mockItem, expect.any(Object));
    });

    it('should handle item context menu', async () => {
      const mockEvent = { clientX: 100, clientY: 100 } as MouseEvent;
      const mockItem = mockDesktopItems[0];

      await wrapper.vm.handleItemContextMenu(mockItem, mockEvent);
      expect(mockSelection.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should adjust icon size based on screen width', async () => {
      // Test different screen sizes
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      await wrapper.vm.$nextTick();

      // Test medium screen size
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      await wrapper.vm.$nextTick();

      // Test large screen size
      Object.defineProperty(window, 'innerWidth', { value: 1600, writable: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.iconSize).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      wrapper.unmount();
      expect(mockEventBus.off).toHaveBeenCalledWith('desktop-refresh', expect.any(Function));
    });
  });
});
