<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";
import { useWindowsFS } from "../composables/useFS";
import { ref, onMounted, computed, onUnmounted, reactive } from "vue";
import { useEventBus } from "../composables/useEventBus";

// Types
interface FSNode {
  path: string;
  parent: string;
  name: string;
  type: "file" | "directory" | "symlink";
  createdAt: Date;
  modifiedAt: Date;
  attributes: {
    readOnly: boolean;
    hidden: boolean;
  };
  content?: ArrayBuffer;
  target?: string;
  desktopX?: number;
  desktopY?: number;
}

interface Position {
  x: number;
  y: number;
}

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface ContextMenu {
  show: boolean;
  x: number;
  y: number;
  target: FSNode | null;
}

// Constants
const GRID_SIZE = 80;
const PADDING = 16;
const DRAG_THRESHOLD = 5;
const ICON_SIZE = 80;

// Composables
const windows = useWindowsStore();
const fs = useWindowsFS();

// State
const desktopItems = ref<FSNode[]>([]);
const selectedItems = ref<Set<string>>(new Set());
const isDragging = ref(false);
const isMoving = ref(false);
const isMouseDown = ref(false);
const hasMoved = ref(false);
const isGridEnabled = ref(true);

// Drag state
const dragState = reactive({
  startPos: { x: 0, y: 0 } as Position,
  currentPos: { x: 0, y: 0 } as Position,
  offset: { x: 0, y: 0 } as Position,
  item: null as FSNode | null
});

// Selection state
const selectionBox = reactive<SelectionBox>({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  visible: false
});

// Context menu state
const contextMenu = reactive<ContextMenu>({
  show: false,
  x: 0,
  y: 0,
  target: null
});

// Computed properties
const hasSelection = computed(() => selectedItems.value.size > 0);
const hasSingleSelection = computed(() => selectedItems.value.size === 1);

const iconSize = computed(() => {
  if (typeof window === 'undefined') return 'text-4xl';
  const width = window.innerWidth;
  if (width < 640) return 'text-2xl';
  if (width < 768) return 'text-3xl';
  if (width < 1024) return 'text-3xl';
  return 'text-4xl';
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
const eventBus = useEventBus();

async function initializeDesktop() {
  await fs.initializeDrive("C");
  await loadDesktopItems();
  eventBus.on('desktop-refresh', loadDesktopItems);
}

function setupEventListeners() {
  document.addEventListener('click', closeContextMenu);
  // document.addEventListener('selectstart', preventTextSelection);
  // document.addEventListener('mousedown', preventTextSelection);
}

function cleanupEventListeners() {
  document.removeEventListener('click', closeContextMenu);
  document.removeEventListener('selectstart', preventTextSelection);
  document.removeEventListener('mousedown', preventTextSelection);
}

function preventTextSelection(e: Event) {
  e.preventDefault();
}

// Desktop item management
async function loadDesktopItems() {
  try {
    const items = await fs.readdir("C:\\System\\Desktop");
    const filteredItems = items.filter(item => !item.attributes.hidden);
    assignDefaultPositions(filteredItems);
    desktopItems.value = filteredItems;
  } catch (error) {
    console.error('Failed to load desktop items:', error);
    await handleLoadError();
  }
}

function assignDefaultPositions(items: FSNode[]) {
  const occupiedPositions = new Set<string>();

  // First, snap existing items to the grid and record their positions
  items.forEach(item => {
    if (item.desktopX !== undefined && item.desktopY !== undefined) {
      item.desktopX = Math.round((item.desktopX - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING;
      item.desktopY = Math.round((item.desktopY - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING;
      occupiedPositions.add(`${item.desktopX},${item.desktopY}`);
    }
  });

  // Now, place new items in the first available spot
  items.forEach(item => {
    if (item.desktopX === undefined || item.desktopY === undefined) {
      const { x, y } = findNextAvailablePosition(PADDING, PADDING, occupiedPositions);
      item.desktopX = x;
      item.desktopY = y;
      occupiedPositions.add(`${x},${y}`);
    }
  });

  // Finally, resolve any stacking that might have occurred from snapping
  resolveStacking(items);
}

async function handleLoadError() {
  try {
    await fs.initializeDrive("C");
    const items = await fs.readdir("C:\\System\\Desktop");
    const filteredItems = items.filter(item => !item.attributes.hidden);
    assignDefaultPositions(filteredItems);
    desktopItems.value = filteredItems;
  } catch (retryError) {
    console.error('Failed to create desktop structure:', retryError);
  }
}

// File operations
async function createFile() {
  const name = prompt("Enter new file name:");
  if (!name) return;
  
  try {
    const filePath = `C:\\System\\Desktop\\${name}`;
    await fs.writeFile(filePath, new ArrayBuffer(0));
    await loadDesktopItems();
  } catch (error) {
    console.error(`Failed to create file '${name}':`, error);
    alert(`Error: ${error instanceof Error ? error.message : 'Could not create file.'}`);
  }
}

async function createDirectory() {
  const name = prompt("Enter new directory name:");
  if (!name) return;
  
  try {
    const dirPath = `C:\\System\\Desktop\\${name}`;
    await fs.mkdir(dirPath);
    await loadDesktopItems();
  } catch (error) {
    console.error(`Failed to create directory '${name}':`, error);
    alert(`Error: ${error instanceof Error ? error.message : 'Could not create directory.'}`);
  }
}

// Selection logic
function selectItem(node: FSNode, event: MouseEvent) {
  if (hasMoved.value) return;
  
  if (event.ctrlKey) {
    toggleSelection(node.path);
  } else if (event.shiftKey && selectedItems.value.size > 0) {
    selectRange(node);
  } else {
    selectSingle(node.path);
  }
}

function toggleSelection(path: string) {
  if (selectedItems.value.has(path)) {
    selectedItems.value.delete(path);
  } else {
    selectedItems.value.add(path);
  }
}

function selectRange(targetNode: FSNode) {
  const items = desktopItems.value;
  const lastSelectedIndex = items.findIndex(item => selectedItems.value.has(item.path));
  const currentIndex = items.findIndex(item => item.path === targetNode.path);
  
  if (lastSelectedIndex !== -1 && currentIndex !== -1) {
    const start = Math.min(lastSelectedIndex, currentIndex);
    const end = Math.max(lastSelectedIndex, currentIndex);
    
    for (let i = start; i <= end; i++) {
      selectedItems.value.add(items[i].path);
    }
  }
}

function selectSingle(path: string) {
  selectedItems.value.clear();
  selectedItems.value.add(path);
}

// Drag and drop logic
function startDrag(event: MouseEvent) {
  if (event.button !== 0) return;
  
  isMouseDown.value = true;
  hasMoved.value = false;
  dragState.startPos = { x: event.clientX, y: event.clientY };
  
  const itemElement = (event.target as HTMLElement).closest('[data-item-path]');
  
  if (itemElement) {
    prepareItemDrag(itemElement, event);
  } else {
    startSelectionDrag(event);
  }
}

function prepareItemDrag(itemElement: Element, event: MouseEvent) {
  const path = itemElement.getAttribute('data-item-path');
  if (!path) return;
  
  const item = desktopItems.value.find(i => i.path === path);
  if (!item) return;
  
  if (!selectedItems.value.has(path)) {
    selectSingle(path);
  }
  
  const rect = itemElement.getBoundingClientRect();
  dragState.offset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };

}

function startSelectionDrag(event: MouseEvent) {
  isDragging.value = true;
  dragState.startPos = { x: event.clientX, y: event.clientY };
  selectionBox.x = event.clientX;
  selectionBox.y = event.clientY;
  selectionBox.width = 0;
  selectionBox.height = 0;
  selectionBox.visible = true;
  selectedItems.value.clear();
}

function onMouseMove(event: MouseEvent) {
  if (!isMouseDown.value) return;
  
  dragState.currentPos = { x: event.clientX, y: event.clientY };
  
  const deltaX = Math.abs(event.clientX - dragState.startPos.x);
  const deltaY = Math.abs(event.clientY - dragState.startPos.y);
  
  if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
    hasMoved.value = true;
    
    if (!isMoving.value && !isDragging.value) {
      startItemMovement(event);
    }
  }
  
  if (isMoving.value && dragState.item) {
    handleItemMovement(event);
  } else if (isDragging.value) {
    handleSelectionDrag(event);
  }
}

function startItemMovement(event: MouseEvent) {
  const itemElement = (event.target as HTMLElement).closest('[data-item-path]');
  if (!itemElement) return;
  
  const path = itemElement.getAttribute('data-item-path');
  if (!path) return;
  
  const item = desktopItems.value.find(i => i.path === path);
  if (item) {
    isMoving.value = true;
    dragState.item = item;
  }
}

function handleItemMovement(event: MouseEvent) {
  if (!dragState.item) return;

  let newX = event.clientX - dragState.offset.x;
  let newY = event.clientY - dragState.offset.y;

  if (isGridEnabled.value) {
    newX = Math.round((newX - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING;
    newY = Math.round((newY - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING;
  }

  let deltaX = newX - dragState.item.desktopX!;
  let deltaY = newY - dragState.item.desktopY!;

  if (deltaX === 0 && deltaY === 0) return;

  // Find the bounding box of the entire selection
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  desktopItems.value.forEach(item => {
    if (selectedItems.value.has(item.path)) {
      minX = Math.min(minX, item.desktopX!);
      minY = Math.min(minY, item.desktopY!);
      maxX = Math.max(maxX, item.desktopX!);
      maxY = Math.max(maxY, item.desktopY!);
    }
  });

  // Adjust delta to keep the entire selection within the viewport
  if (minX + deltaX < PADDING) {
    deltaX = PADDING - minX;
  }
  if (maxX + deltaX > window.innerWidth - ICON_SIZE - PADDING) {
    deltaX = window.innerWidth - ICON_SIZE - PADDING - maxX;
  }
  if (minY + deltaY < PADDING) {
    deltaY = PADDING - minY;
  }
  if (maxY + deltaY > window.innerHeight - ICON_SIZE - PADDING) {
    deltaY = window.innerHeight - ICON_SIZE - PADDING - maxY;
  }

  // Apply the constrained delta to all selected items
  desktopItems.value.forEach(item => {
    if (selectedItems.value.has(item.path)) {
      item.desktopX! += deltaX;
      item.desktopY! += deltaY;
    }
  });
}

function handleSelectionDrag(event: MouseEvent) {
  const deltaX = event.clientX - dragState.startPos.x;
  const deltaY = event.clientY - dragState.startPos.y;
  
  selectionBox.x = Math.min(dragState.startPos.x, event.clientX);
  selectionBox.y = Math.min(dragState.startPos.y, event.clientY);
  selectionBox.width = Math.abs(deltaX);
  selectionBox.height = Math.abs(deltaY);
  
  selectItemsInBox();
}

function selectItemsInBox() {
  const desktopElement = document.querySelector('.desktop-container') as HTMLElement;
  if (!desktopElement) return;
  
  const itemElements = desktopElement.querySelectorAll('[data-item-path]');
  itemElements.forEach((itemElement) => {
    const rect = itemElement.getBoundingClientRect();
    const path = itemElement.getAttribute('data-item-path');
    
    if (path && rect) {
      const intersects = !(
        rect.right < selectionBox.x ||
        rect.left > selectionBox.x + selectionBox.width ||
        rect.bottom < selectionBox.y ||
        rect.top > selectionBox.y + selectionBox.height
      );
      
      if (intersects) {
        selectedItems.value.add(path);
      }
    }
  });
}

function stopDrag() {
  isMouseDown.value = false;

  if (hasMoved.value && dragState.item) {
    console.log('Finished moving item:', dragState.item.name);

    // De-conflict positions
    resolveStacking(desktopItems.value);

    dragState.item = null;
    isMoving.value = false;
  } else if (isDragging.value) {
    isDragging.value = false;
    selectionBox.visible = false;
  }

  // Defer resetting hasMoved to prevent click event after drag
  setTimeout(() => {
    hasMoved.value = false;
  }, 0);
}

function resolveStacking(items: FSNode[]) {
  const positions = new Map<string, FSNode[]>();
  items.forEach(item => {
    const key = `${item.desktopX},${item.desktopY}`;
    if (!positions.has(key)) {
      positions.set(key, []);
    }
    positions.get(key)!.push(item);
  });

  const occupiedSet = new Set(positions.keys());

  positions.forEach((stackedItems) => {
    if (stackedItems.length > 1) {
      // Keep the first item, move the rest
      stackedItems.slice(1).forEach(itemToMove => {
        const { x, y } = findNextAvailablePosition(itemToMove.desktopX!, itemToMove.desktopY!, occupiedSet);
        itemToMove.desktopX = x;
        itemToMove.desktopY = y;
        occupiedSet.add(`${x},${y}`);
      });
    }
  });
}

function findNextAvailablePosition(startX: number, startY: number, occupied: Set<string>): Position {
  let x = PADDING;
  let y = PADDING;
  const maxCols = Math.floor((window.innerWidth - PADDING * 2) / GRID_SIZE);
  const maxRows = Math.floor((window.innerHeight - PADDING * 2) / GRID_SIZE);

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      x = PADDING + c * GRID_SIZE;
      y = PADDING + r * GRID_SIZE;
      if (!occupied.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }
  // Fallback if screen is full
  return { x: startX, y: startY };
}

// Context menu
function showContextMenu(event: MouseEvent, node?: FSNode) {
  event.preventDefault();
  
  if (node && !selectedItems.value.has(node.path)) {
    selectSingle(node.path);
  } else if (!node) {
    selectedItems.value.clear();
  }
  
  contextMenu.show = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.target = node || null;
}

function closeContextMenu() {
  contextMenu.show = false;
}

function toggleGrid() {
  isGridEnabled.value = !isGridEnabled.value;
  closeContextMenu();
}

// Item operations
function openItem(node: FSNode) {
  if (node.type === "directory") {
    windows.openApp("File Explorer", { type: "component", name: "FileExplorer", props: { initialPath: node.path } });
  } else if (node.type === "symlink") {
    if (node.target === "fileexplorer://") {
      windows.openApp("File Explorer", { type: "component", name: "FileExplorer", props: { initialPath: "C:\\" } });
    } else {
      alert(`Opening symlink: ${node.name} -> ${node.target}`);
    }
  } else {
    alert(`Opening file: ${node.name}`);
  }
}

function openFileExplorer() {
  windows.openApp("File Explorer", { type: "component", name: "FileExplorer", props: { initialPath: "C:\\" } });
}

function getFileIcon(node: FSNode) {
  switch (node.type) {
    case 'directory': return '📁';
    case 'symlink': return '🔗';
    default: return '📄';
  }
}

function selectAll() {
  desktopItems.value.forEach(item => selectedItems.value.add(item.path));
  closeContextMenu();
}
</script>

<template>
  <div
    class="absolute inset-0 bg-cover bg-center text-white p-4 select-none desktop-container"
    :class="{ 'cursor-grabbing': isMoving, 'cursor-crosshair': isDragging }"
    style="background-image: url('/src/assets/bg.jpg')"
    @contextmenu="showContextMenu($event)"
    @mousedown="startDrag"
    @mousemove="onMouseMove"
    @mouseup="stopDrag"
    @mouseleave="stopDrag"
  >
    <!-- Desktop Items -->
    <div 
      v-for="item in desktopItems" 
      :key="item.path"
      :data-item-path="item.path"
      @click="selectItem(item, $event)"
      @dblclick="openItem(item)"
      @contextmenu="showContextMenu($event, item)"
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
      <div :class="`${iconSize} mb-1`">{{ getFileIcon(item) }}</div>
      <div class="text-xs font-medium break-words leading-tight text-white drop-shadow-lg hover:text-gray-500 hover:drop-shadow-none">
        {{ item.name }}
      </div>
    </div>
    
    <!-- Fallback File Explorer -->
    <div 
      v-if="desktopItems.length === 0" 
      @click="openFileExplorer()"
      class="absolute w-20 h-20 p-2 rounded hover:bg-white/10 cursor-pointer text-center transition-colors flex flex-col justify-center items-center"
      style="left: 16px; top: 16px;"
    >
      <div :class="`${iconSize} mb-1`">🔗</div>
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
      class="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48"
    >
      <!-- Open -->
      <button 
        v-if="hasSingleSelection" 
        @click="openItem(contextMenu.target!); closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
      >
        ▶️ Open
      </button>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1" />
      
      <!-- Cut -->
      <button 
        v-if="hasSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
      >
        ✂️ Cut
      </button>
      
      <!-- Copy -->
      <button 
        v-if="hasSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
      >
        📋 Copy
      </button>
      
      <!-- Paste -->
      <button 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
      >
        📋 Paste
      </button>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1" />
      
      <!-- New -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          📄 New
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button 
            @click="createFile(); closeContextMenu()" 
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
          >
            📄 Text Document
          </button>
          <button 
            @click="createDirectory(); closeContextMenu()" 
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
          >
            📁 Folder
          </button>
        </div>
      </div>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1" />
      
      <!-- Rename -->
      <button 
        v-if="hasSingleSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
      >
        ✏️ Rename
      </button>
      
      <!-- Delete -->
      <button 
        v-if="hasSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-red-600"
      >
        🗑️ Delete
      </button>
      
      <div class="border-t border-gray-200 my-1" />
      
      <!-- Select All -->
      <button 
        @click="selectAll()" 
        :disabled="desktopItems.length === 0"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800"
      >
        ☑️ Select All
      </button>
      
      <div v-if="hasSingleSelection" class="border-t border-gray-200 my-1" />
      
      <!-- Properties -->
      <button 
        v-if="hasSingleSelection" 
        @click="closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
      >
        ⚙️ Properties
      </button>
      
      <div class="border-t border-gray-200 my-1" />
      
      <!-- View -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          👁️ View
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button 
            @click="toggleGrid()" 
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center text-gray-800"
          >
            <span class="mr-2">{{ isGridEnabled ? '☑' : '☐' }}</span>
            Grid
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove custom opacity styles to allow Tailwind's opacity classes to work */
</style>
