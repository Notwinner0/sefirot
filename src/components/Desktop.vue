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

// Import Icons
import {
  FolderOpenIcon,
  LinkIcon,
  OpenInNewIcon,
  ContentCutIcon,
  ContentCopyIcon,
  ContentPasteIcon,
  FileDocumentOutlineIcon,
  FolderPlusIcon,
  PencilIcon,
  DeleteIcon,
  CheckboxMarkedOutlineIcon,
  CheckboxBlankOutlineIcon,
  CogIcon,
  EyeOutlineIcon
} from '../icons';

// Import icon utilities
import { getIconColorForFile, getIconForFile } from '../utils/iconColors';

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

  if (isMoving) {
    handleItemMovement(event, desktopItems.value, selectedItems.value, moveItems);
  } else if (isDragging) {
    const pathsToSelect = selectItemsInBox(selectedItems.value);
    pathsToSelect.forEach(path => toggleSelection(path));
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

// Item operations
function getFileIcon(node: FSNode) {
  switch (node.type) {
    case 'directory': return FolderOpenIcon;
    case 'symlink':
      if (node.target === "fileexplorer://") {
        return FolderOpenIcon; // Use FolderOpenIcon for File Explorer symlink
      }
      return LinkIcon; // Keep LinkIcon for other symlinks
    default: return getIconForFile(node.name);
  }
}

function getFileColor(node: FSNode) {
  switch (node.type) {
    case 'directory': return '#FFCA28'; // Amber for folders
    case 'symlink': return '#03A9F4'; // Light Blue for symlinks
    case 'file':
      // Use the centralized color system for files
      return getIconColorForFile(node.name);
    default: return '#FFFFFF'; // Default white
  }
}

function handleSelectAll() {
  selectAll(desktopItems.value);
  closeContextMenu();
}

function handleRefreshDesktop() {
  loadDesktopItems();
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
    <div 
      v-for="item in desktopItems" 
      :key="item.path"
      :data-item-path="item.path"
      @click="selectItem(item, $event)"
      @dblclick="openItem(item, windows)"
      @contextmenu.stop="showContextMenu($event, item)"
      :class="[
        'absolute w-20 h-20 p-2 rounded hover:bg-white/10 cursor-pointer text-center transition-colors flex flex-col justify-center items-center',
        selectedItems.has(item.path) ? 'bg-blue-500/20 border-2 border-blue-400' : '',
        isMoving && selectedItems.has(item.path) ? 'opacity-50 scale-95' : ''
      ]"
      :style="{
        left: item.desktopX + 'px',
        top: item.desktopY + 'px'
      }"
    >
      <div class="relative">
        <component :is="getFileIcon(item)" :size="iconSize === 'text-4xl' ? 48 : 32" :fillColor="getFileColor(item)" class="mb-1" />
        <LinkIcon 
          v-if="item.type === 'symlink'" 
          :size="16" 
          fillColor="#FFFFFF" 
          class="absolute bottom-0 left-0 -mb-1 -ml-1 bg-blue-500 rounded-full p-0.5" 
        />
      </div>
      <div class="text-xs font-medium break-words leading-tight text-white drop-shadow-lg hover:text-gray-500 hover:drop-shadow-none">
        {{ getDisplayName(item) }}
      </div>
    </div>
    
    <!-- Fallback File Explorer -->
    <div 
      v-if="desktopItems.length === 0" 
      @click="openFileExplorer(windows)"
      class="absolute w-20 h-20 p-2 rounded hover:bg-white/10 cursor-pointer text-center transition-colors flex flex-col justify-center items-center"
      style="left: 16px; top: 16px;"
    >
      <FolderOpenIcon :size="iconSize === 'text-4xl' ? 48 : 32" fillColor="#FFCA28" class="mb-1" />
      <div class="text-xs font-medium break-words leading-tight text-white drop-shadow-lg hover:text-gray-500 hover:drop-shadow-none">
        File Explorer
      </div>
    </div>

    <!-- Selection Box -->
    <div 
      v-if="selectionBox.visible"
      class="fixed border-2 border-blue-400 bg-blue-400/10 pointer-events-none z-40"
      :style="{
        left: selectionBox.x + 'px',
        top: selectionBox.y + 'px',
        width: selectionBox.width + 'px',
        height: selectionBox.height + 'px'
      }"
    />

    <!-- Context Menu -->
    <div
      v-if="contextMenu.show"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48 context-menu"
    >
      <!-- Open -->
      <button
        v-if="hasSingleSelection"
        @click="closeContextMenu(); openItem(contextMenu.target!, windows)"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <OpenInNewIcon :size="18" class="mr-2" /> Open
      </button>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1" />
      
      <!-- Cut -->
      <button 
        v-if="hasSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <ContentCutIcon :size="18" class="mr-2" /> Cut
      </button>
      
      <!-- Copy -->
      <button 
        v-if="hasSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <ContentCopyIcon :size="18" class="mr-2" /> Copy
      </button>
      
      <!-- Paste -->
      <button 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <ContentPasteIcon :size="18" class="mr-2" /> Paste
      </button>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1" />
      
      <!-- New -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          <FileDocumentOutlineIcon :size="18" class="mr-2" /> New
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button
            @click="createFile(fs, loadDesktopItems); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
          >
            <FileDocumentOutlineIcon :size="18" class="mr-2" /> Text Document
          </button>
          <button
            @click="createDirectory(fs, loadDesktopItems); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
          >
            <FolderPlusIcon :size="18" class="mr-2" /> Folder
          </button>
        </div>
      </div>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1" />
      
      <!-- Rename -->
      <button 
        v-if="hasSingleSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <PencilIcon :size="18" class="mr-2" /> Rename
      </button>
      
      <!-- Delete -->
      <button 
        v-if="hasSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-red-600 flex items-center"
      >
        <DeleteIcon :size="18" class="mr-2" /> Delete
      </button>
      
      <div class="border-t border-gray-200 my-1" />
      
      <!-- Select All -->
      <button
        @click="handleSelectAll()"
        :disabled="desktopItems.length === 0"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 flex items-center"
      >
        <CheckboxMarkedOutlineIcon :size="18" class="mr-2" /> Select All
      </button>
      
      <div v-if="hasSingleSelection" class="border-t border-gray-200 my-1" />
      
      <!-- Properties -->
      <button 
        v-if="hasSingleSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <CogIcon :size="18" class="mr-2" /> Properties
      </button>
      
      <div class="border-t border-gray-200 my-1" />
      
      <!-- View -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          <EyeOutlineIcon :size="18" class="mr-2" /> View
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button
            @click="toggleGrid()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center text-gray-800"
          >
            <component :is="isGridEnabled ? CheckboxMarkedOutlineIcon : CheckboxBlankOutlineIcon" :size="18" class="mr-2" />
            Grid
          </button>
        </div>
      </div>

      <div class="border-t border-gray-200 my-1" />

      <!-- Refresh -->
      <button
        @click="handleRefreshDesktop()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
      >
        <CogIcon :size="18" class="mr-2" /> Refresh
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Remove custom opacity styles to allow Tailwind's opacity classes to work */
</style>
