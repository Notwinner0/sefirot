<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useWindowsStore } from "../stores/windows";
import { useWindowsFS } from "../composables/useFS";
import { useEventBus } from "../composables/useEventBus";
import { useContextMenu } from "../composables/useContextMenu";

// Import new composables
import { useDesktopSelection } from "../composables/useDesktopSelection";
import { useDesktopPositioning } from "../composables/useDesktopPositioning";
import { useDesktopDrag } from "../composables/useDesktopDrag";
import { useDesktopFileOps } from "../composables/useDesktopFileOps";

// Import config and types
import { DESKTOP_CONFIG } from "../config/desktop";
import type { FSNode } from "../types/desktop";

// Import icons
import { FolderOpenIcon } from '../icons';

// Import new components
import DesktopItem from './DesktopItem.vue'
import SelectionBox from './SelectionBox.vue'
import DesktopContextMenu from './DesktopContextMenu.vue'

// Core composables
const windows = useWindowsStore();
const fs = useWindowsFS();
const eventBus = useEventBus();

// Desktop-specific composables
const {
  selectedItems,
  hasSelection,
  hasSingleSelection,
  selectItem: selectItemBase,
  toggleSelection,
  selectRange,
  selectAll,
  clearSelection
} = useDesktopSelection();

const {
  assignDefaultPositions,
  moveItems
} = useDesktopPositioning();

const {
  isDragging,
  isMoving,
  hasMoved,
  isGridEnabled,
  selectionBox,
  startDrag,
  prepareItemDrag,
  onMouseMove,
  startItemMovement,
  handleItemMovement,
  selectItemsInBox,
  stopDrag,
  toggleGrid
} = useDesktopDrag();

const {
  createFile,
  createDirectory,
  openItem,
  openFileExplorer,
  getDisplayName
} = useDesktopFileOps();

// Context menu
const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu('Desktop');

// State
const desktopItems = ref<FSNode[]>([]);

// Computed properties
const iconSize = computed(() => {
  if (typeof window === 'undefined') return DESKTOP_CONFIG.ICON_SIZES.lg;
  const width = window.innerWidth;
  if (width < DESKTOP_CONFIG.BREAKPOINTS.xs) return DESKTOP_CONFIG.ICON_SIZES.xs;
  if (width < DESKTOP_CONFIG.BREAKPOINTS.sm) return DESKTOP_CONFIG.ICON_SIZES.sm;
  if (width < DESKTOP_CONFIG.BREAKPOINTS.md) return DESKTOP_CONFIG.ICON_SIZES.md;
  return DESKTOP_CONFIG.ICON_SIZES.lg;
});

// Lifecycle
onMounted(async () => {
  await initializeDesktop();
  setupEventListeners();
});

onUnmounted(() => {
  cleanupEventListeners();
  eventBus.off('desktop-refresh', loadDesktopItems);
});

// Initialization
async function initializeDesktop() {
  await fs.initializeDrive(DESKTOP_CONFIG.PATHS.DRIVE);
  await loadDesktopItems();
  eventBus.on('desktop-refresh', loadDesktopItems);
}

function setupEventListeners() {
  // Note: Context menu global click handling is now managed by the useContextMenu composable
}

function cleanupEventListeners() {
  // Note: Context menu global click handling is now managed by the useContextMenu composable
}

// Desktop item management
async function loadDesktopItems() {
  try {
    const items = await fs.readdir(DESKTOP_CONFIG.PATHS.DESKTOP);
    const filteredItems = items.filter(item => !item.attributes.hidden);
    assignDefaultPositions(filteredItems);
    desktopItems.value = filteredItems;
  } catch (error) {
    console.error('Failed to load desktop items:', error);
    await handleLoadError();
  }
}

async function handleLoadError() {
  try {
    await fs.initializeDrive(DESKTOP_CONFIG.PATHS.DRIVE);
    const items = await fs.readdir(DESKTOP_CONFIG.PATHS.DESKTOP);
    const filteredItems = items.filter(item => !item.attributes.hidden);
    assignDefaultPositions(filteredItems);
    desktopItems.value = filteredItems;
  } catch (retryError) {
    console.error('Failed to create desktop structure:', retryError);
  }
}

// Selection logic
function selectItem(node: FSNode, event: MouseEvent) {
  if (hasMoved) return;

  if (event.ctrlKey) {
    toggleSelection(node.path);
  } else if (event.shiftKey && selectedItems.value.size > 0) {
    selectRange(node, desktopItems.value);
  } else {
    selectItemBase(node.path);
  }
}

// Drag and drop logic
function handleDragStart(event: MouseEvent) {
  const result = startDrag(event);
  if (result.type === 'item' && result.itemElement) {
    const item = prepareItemDrag(result.itemElement, event, desktopItems.value, selectedItems.value, selectItemBase);
    if (item) {
      startItemMovement(item);
    }
  }
}

function handleMouseMove(event: MouseEvent) {
  const result = onMouseMove(event);
  if (result.shouldStartMovement) {
    const itemElement = (event.target as HTMLElement).closest('[data-item-path]');
    if (itemElement) {
      const path = itemElement.getAttribute('data-item-path');
      if (path) {
        const item = desktopItems.value.find(i => i.path === path);
        if (item) {
          startItemMovement(item);
        }
      }
    }
  }

  // Optimize: Only call expensive operations when necessary
  if (isMoving.value) {
    handleItemMovement(event, desktopItems.value, selectedItems.value, moveItems);
  } else if (isDragging.value) {
    const pathsToSelect = selectItemsInBox(selectedItems.value);
    if (pathsToSelect.length > 0) {
      pathsToSelect.forEach(path => toggleSelection(path));
    }
  }
}

function handleStopDrag() {
  const result = stopDrag();
  if (result.finishedMoving) {
    // Resolve stacking conflicts after moving
    const { resolveStacking } = useDesktopPositioning();
    resolveStacking(desktopItems.value);
  }
}



function handleItemDoubleClick(item: FSNode) {
  openItem(item, windows);
}

function handleItemContextMenu(item: FSNode, event: MouseEvent) {
  showContextMenu(event, item);
}

function handleSelectAll() {
  selectAll(desktopItems.value);
  closeContextMenu();
}

function handleRefreshDesktop() {
  loadDesktopItems();
  closeContextMenu();
}

function handleContextMenuAction(action: string) {
  switch (action) {
    case 'open':
      if (contextMenu.value.target) {
        openItem(contextMenu.value.target, windows);
      }
      break;
    case 'cut':
      // TODO: Implement cut
      break;
    case 'copy':
      // TODO: Implement copy
      break;
    case 'paste':
      // TODO: Implement paste
      break;
    case 'new-file':
      createFile(fs, loadDesktopItems);
      break;
    case 'new-folder':
      createDirectory(fs, loadDesktopItems);
      break;
    case 'rename':
      // TODO: Implement rename
      break;
    case 'delete':
      // TODO: Implement delete
      break;
    case 'select-all':
      handleSelectAll();
      break;
    case 'properties':
      // TODO: Implement properties
      break;
    case 'toggle-grid':
      toggleGrid();
      break;
    case 'refresh':
      handleRefreshDesktop();
      break;
  }
  closeContextMenu();
}
</script>

<template>
  <div
    class="absolute inset-0 bg-cover bg-center text-white p-4 select-none desktop-container"
    :class="{ 'cursor-grabbing': isMoving, 'cursor-crosshair': isDragging }"
    style="background: linear-gradient(to right top, #051937, #004d7a, #008793, #00bf72, #a8eb12);"
    @contextmenu="showContextMenu($event)"
    @click="clearSelection"
    @mousedown="handleDragStart"
    @mousemove="handleMouseMove"
    @mouseup="handleStopDrag"
    @mouseleave="handleStopDrag"
  >
    <!-- Desktop Items -->
    <DesktopItem
      v-for="item in desktopItems"
      :key="item.path"
      :item="item"
      :icon-size="iconSize === 'text-4xl' ? 48 : 32"
      :is-selected="selectedItems.has(item.path)"
      :is-moving="isMoving"
      @itemclick="(item, event) => selectItem(item, event)"
      @itemdblclick="(item) => handleItemDoubleClick(item)"
      @itemcontextmenu="(item, event) => handleItemContextMenu(item, event)"
    />
    
    <!-- Fallback File Explorer -->
    <div 
      v-if="desktopItems.length === 0" 
      @click="openFileExplorer(windows)"
      class="absolute w-20 h-20 p-2 rounded hover:bg-white/10 cursor-pointer text-center transition-colors flex flex-col justify-center items-center"
      style="left: 16px; top: 16px;"
    >
      <FolderOpenIcon :size="iconSize === 'text-4xl' ? 48 : 32" fillColor="#FFCA28" class="mb-1" />
      <div class="text-xs font-medium break-words leading-tight text-white drop-shadow-lg hover:drop-shadow-none">
        File Explorer
      </div>
    </div>

    <!-- Selection Box -->
    <SelectionBox
      :visible="selectionBox.visible"
      :x="selectionBox.x"
      :y="selectionBox.y"
      :width="selectionBox.width"
      :height="selectionBox.height"
    />

    <!-- Context Menu -->
    <DesktopContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :has-selection="hasSelection"
      :has-single-selection="hasSingleSelection"
      :can-select-all="desktopItems.length > 0"
      :is-grid-enabled="isGridEnabled"
      @action="handleContextMenuAction"
    />
  </div>
</template>

<style scoped>
/* Remove custom opacity styles to allow Tailwind's opacity classes to work */
</style>
