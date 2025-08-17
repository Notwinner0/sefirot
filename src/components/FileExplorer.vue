<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useWindowsFS } from "../composables/useFS";
import { useWindowsStore } from "../stores/windows";

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
  target?: string; // For symlinks
}

const fs = useWindowsFS();
const currentPath = ref("C:\\");
const nodes = ref<FSNode[]>([]);
const selectedItems = ref<Set<string>>(new Set());
const viewMode = ref<'details' | 'list' | 'icons'>('details');
const showHidden = ref(false);

// Context menu state
const contextMenu = ref<{
  show: boolean;
  x: number;
  y: number;
  target: FSNode | null;
}>({
  show: false,
  x: 0,
  y: 0,
  target: null
});

// Clipboard for cut/copy operations
const clipboard = ref<{
  type: 'cut' | 'copy' | null;
  items: FSNode[];
}>({
  type: null,
  items: []
});

async function loadDirectory(path: string) {
  try {
    const allNodes = await fs.readdir(path);
    nodes.value = allNodes.filter(node => showHidden.value || !node.attributes.hidden);
    currentPath.value = path;
    selectedItems.value.clear();
  } catch (error) {
    console.error(`Failed to read directory '${path}':`, error);
    alert(`Error: Could not load directory '${path}'.`);
  }
}

onMounted(async () => {
  await fs.initializeDrive("C");
  await loadDirectory(currentPath.value);
  
  // Close context menu when clicking outside
  document.addEventListener('click', closeContextMenu);
});

function navigate(node: FSNode) {
  if (node.type === "directory") {
    loadDirectory(node.path);
  } else if (node.type === "symlink") {
    // Handle symlink navigation
    if (node.target === "fileexplorer://") {
      // Open File Explorer in a new window
      const windows = useWindowsStore();
      windows.openApp("File Explorer", { type: "component", name: "FileExplorer" });
    } else {
      alert(`Opening symlink: ${node.name} -> ${node.target}`);
    }
  } else {
    alert(`Opening file: ${node.name}`);
  }
}

function selectItem(node: FSNode, event: MouseEvent) {
  if (event.ctrlKey) {
    // Multi-select with Ctrl
    if (selectedItems.value.has(node.path)) {
      selectedItems.value.delete(node.path);
    } else {
      selectedItems.value.add(node.path);
    }
  } else {
    // Single select
    selectedItems.value.clear();
    selectedItems.value.add(node.path);
  }
}

function showContextMenu(event: MouseEvent, node?: FSNode) {
  event.preventDefault();
  
  // If right-clicking on a specific item, select it
  if (node && !selectedItems.value.has(node.path)) {
    selectedItems.value.clear();
    selectedItems.value.add(node.path);
  }
  
  // If right-clicking on empty space, clear selection
  if (!node) {
    selectedItems.value.clear();
  }
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    target: node || null
  };
}

function closeContextMenu() {
  contextMenu.value.show = false;
}

function getSelectedNodes(): FSNode[] {
  return nodes.value.filter(node => selectedItems.value.has(node.path));
}

// Check if context menu should show item-specific options
const hasSelection = computed(() => selectedItems.value.size > 0);
const hasSingleSelection = computed(() => selectedItems.value.size === 1);
const hasMultipleSelection = computed(() => selectedItems.value.size > 1);

async function createFile() {
  const name = prompt("Enter new file name:");
  if (name) {
    const filePath = `${currentPath.value}\\${name}`;
    try {
      await fs.writeFile(filePath, new ArrayBuffer(0));
      await loadDirectory(currentPath.value);
    } catch (error) {
      console.error(`Failed to create file '${filePath}':`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not create file.'}`);
    }
  }
}

async function createDirectory() {
  const name = prompt("Enter new directory name:");
  if (name) {
    const dirPath = `${currentPath.value}\\${name}`;
    try {
      await fs.mkdir(dirPath);
      await loadDirectory(currentPath.value);
    } catch (error) {
      console.error(`Failed to create directory '${dirPath}':`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not create directory.'}`);
    }
  }
}

async function deleteSelected() {
  if (selectedItems.value.size === 0) return;
  
  if (confirm(`Delete ${selectedItems.value.size} item(s)?`)) {
    for (const path of selectedItems.value) {
      try {
        const node = nodes.value.find(n => n.path === path);
        if (node) {
          if (node.type === 'directory') {
            await fs.rmdir(node.path, true);
          } else {
            await fs.rm(node.path);
          }
        }
      } catch (error) {
        console.error(`Failed to delete '${path}':`, error);
      }
    }
    await loadDirectory(currentPath.value);
  }
}

async function cutSelected() {
  const selectedNodes = getSelectedNodes();
  if (selectedNodes.length === 0) return;
  
  clipboard.value = {
    type: 'cut',
    items: selectedNodes
  };
}

async function copySelected() {
  const selectedNodes = getSelectedNodes();
  if (selectedNodes.length === 0) return;
  
  clipboard.value = {
    type: 'copy',
    items: selectedNodes
  };
}

async function pasteItems() {
  if (!clipboard.value.type || clipboard.value.items.length === 0) return;
  
  for (const item of clipboard.value.items) {
    try {
      const newName = clipboard.value.type === 'copy' ? 
        `${item.name} - Copy` : item.name;
      const newPath = `${currentPath.value}\\${newName}`;
      
      if (item.type === 'file') {
        const content = await fs.readFile(item.path);
        if (content) {
          await fs.writeFile(newPath, content);
        }
      } else {
        await fs.mkdir(newPath);
        // Copy directory contents recursively
        await copyDirectoryContents(item.path, newPath);
      }
      
      // If it was a cut operation, delete the original
      if (clipboard.value.type === 'cut') {
        if (item.type === 'directory') {
          await fs.rmdir(item.path, true);
        } else {
          await fs.rm(item.path);
        }
      }
    } catch (error) {
      console.error(`Failed to ${clipboard.value.type} '${item.name}':`, error);
    }
  }
  
  // Clear clipboard after cut operation
  if (clipboard.value.type === 'cut') {
    clipboard.value = { type: null, items: [] };
  }
  
  await loadDirectory(currentPath.value);
}

async function copyDirectoryContents(sourcePath: string, destPath: string) {
  const children = await fs.readdir(sourcePath);
  for (const child of children) {
    const newChildPath = `${destPath}\\${child.name}`;
    if (child.type === 'file') {
      const content = await fs.readFile(child.path);
      if (content) {
        await fs.writeFile(newChildPath, content);
      }
    } else {
      await fs.mkdir(newChildPath);
      await copyDirectoryContents(child.path, newChildPath);
    }
  }
}

async function renameItem() {
  const selectedNodes = getSelectedNodes();
  if (selectedNodes.length !== 1) return;
  
  const node = selectedNodes[0];
  const newName = prompt("Enter new name:", node.name);
  if (newName && newName !== node.name) {
    try {
      const newPath = `${currentPath.value}\\${newName}`;
      await fs.move(node.path, newPath);
      await loadDirectory(currentPath.value);
    } catch (error) {
      console.error(`Failed to rename '${node.name}':`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not rename item.'}`);
    }
  }
}

function showProperties() {
  const selectedNodes = getSelectedNodes();
  if (selectedNodes.length === 0) return;
  
  const node = selectedNodes[0];
  const properties = `
Properties for: ${node.name}
Type: ${node.type === 'directory' ? 'File folder' : 'File'}
Location: ${currentPath.value}
Size: ${node.type === 'directory' ? '--' : '0 KB'}
Created: ${node.createdAt.toLocaleString()}
Modified: ${node.modifiedAt.toLocaleString()}
Read-only: ${node.attributes.readOnly ? 'Yes' : 'No'}
Hidden: ${node.attributes.hidden ? 'Yes' : 'No'}
  `;
  
  alert(properties);
}

function selectAll() {
  selectedItems.value.clear();
  nodes.value.forEach(node => selectedItems.value.add(node.path));
}

const parentPath = computed(() => {
  if (currentPath.value.endsWith(":\\")) {
    return null;
  }
  const lastSlashIndex = currentPath.value.lastIndexOf("\\");
  return currentPath.value.substring(0, lastSlashIndex);
});

function goUp() {
  if (parentPath.value) {
    loadDirectory(parentPath.value);
  }
}

function goHome() {
  loadDirectory("C:\\");
}

const sortedNodes = computed(() => {
  return [...nodes.value].sort((a, b) => {
    // Directories first, then files
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });
});

function formatDate(date: Date) {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(node: FSNode) {
  if (node.type === 'directory') {
    return '📁';
  } else if (node.type === 'symlink') {
    return '🔗';
  }
  // You could add more file type icons here
  return '📄';
}
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Toolbar -->
    <div class="bg-gray-100 border-b border-gray-300 p-2 flex items-center space-x-2">
      <button @click="goUp" :disabled="!parentPath" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-800">
        ↑ Up
      </button>
      <button @click="goHome" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-800">
        🏠 Home
      </button>
      <div class="w-px h-6 bg-gray-300"></div>
      <button @click="createFile" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-800">
        📄 New File
      </button>
      <button @click="createDirectory" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-800">
        📁 New Folder
      </button>
      <button @click="deleteSelected" :disabled="selectedItems.size === 0"
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-800">
        🗑️ Delete
      </button>
      <div class="w-px h-6 bg-gray-300"></div>
      <label class="flex items-center space-x-1 text-sm text-gray-800">
        <input type="checkbox" v-model="showHidden" @change="loadDirectory(currentPath)" class="w-4 h-4">
        <span>Show hidden</span>
      </label>
    </div>

    <!-- Address Bar -->
    <div class="bg-gray-50 border-b border-gray-300 p-2">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-800">Address:</span>
        <div class="flex-1 bg-white border border-gray-300 rounded px-2 py-1">
          <span class="text-sm font-mono text-gray-900">{{ currentPath }}</span>
        </div>
      </div>
    </div>

    <!-- View Mode Toggle -->
    <div class="bg-gray-50 border-b border-gray-300 p-1 flex items-center space-x-1">
      <button @click="viewMode = 'details'" 
        :class="['px-2 py-1 text-xs rounded', viewMode === 'details' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300']">
        Details
      </button>
      <button @click="viewMode = 'list'" 
        :class="['px-2 py-1 text-xs rounded', viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300']">
        List
      </button>
      <button @click="viewMode = 'icons'" 
        :class="['px-2 py-1 text-xs rounded', viewMode === 'icons' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300']">
        Icons
      </button>
    </div>

    <!-- File List -->
    <div class="flex-1 overflow-auto bg-white" @contextmenu="showContextMenu($event)">
      <!-- Details View -->
      <div v-if="viewMode === 'details' && sortedNodes.length > 0" class="w-full">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 sticky top-0">
            <tr class="border-b border-gray-300">
              <th class="text-left p-2 font-medium text-gray-800">Name</th>
              <th class="text-left p-2 font-medium text-gray-800">Date Modified</th>
              <th class="text-left p-2 font-medium text-gray-800">Type</th>
              <th class="text-left p-2 font-medium text-gray-800">Size</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="node in sortedNodes" :key="node.path"
              @click="selectItem(node, $event)"
              @dblclick="navigate(node)"
              @contextmenu="showContextMenu($event, node)"
              :class="['border-b border-gray-100 hover:bg-blue-50 cursor-pointer', 
                selectedItems.has(node.path) ? 'bg-blue-100' : '']">
              <td class="p-2 flex items-center">
                <span class="mr-2">{{ getFileIcon(node) }}</span>
                <span class="font-medium text-gray-900">{{ node.name }}</span>
              </td>
              <td class="p-2 text-gray-700">{{ formatDate(node.modifiedAt) }}</td>
              <td class="p-2 text-gray-700">
                {{ node.type === 'directory' ? 'File folder' : 
                   node.type === 'symlink' ? 'Shortcut' : 'File' }}
              </td>
              <td class="p-2 text-gray-700">
                {{ node.type === 'directory' ? '--' : 
                   node.type === 'symlink' ? '--' : '0 KB' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- List View -->
      <div v-else-if="viewMode === 'list' && sortedNodes.length > 0" class="p-2">
        <div class="grid grid-cols-1 gap-1">
          <div v-for="node in sortedNodes" :key="node.path"
            @click="selectItem(node, $event)"
            @dblclick="navigate(node)"
            @contextmenu="showContextMenu($event, node)"
            :class="['p-2 rounded hover:bg-blue-50 cursor-pointer flex items-center', 
              selectedItems.has(node.path) ? 'bg-blue-100' : '']">
            <span class="mr-2">{{ getFileIcon(node) }}</span>
            <span class="font-medium text-gray-900">{{ node.name }}</span>
          </div>
        </div>
      </div>

      <!-- Icons View -->
      <div v-else-if="viewMode === 'icons' && sortedNodes.length > 0" class="p-4">
        <div class="grid grid-cols-6 gap-4">
          <div v-for="node in sortedNodes" :key="node.path"
            @click="selectItem(node, $event)"
            @dblclick="navigate(node)"
            @contextmenu="showContextMenu($event, node)"
            :class="['p-3 rounded hover:bg-blue-50 cursor-pointer text-center', 
              selectedItems.has(node.path) ? 'bg-blue-100' : '']">
            <div class="text-3xl mb-2">{{ getFileIcon(node) }}</div>
            <div class="text-xs font-medium break-words text-gray-900">{{ node.name }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="sortedNodes.length === 0" class="flex items-center justify-center h-full text-gray-600">
        <div class="text-center">
          <div class="text-4xl mb-2">📁</div>
          <div class="text-gray-700">This folder is empty</div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="bg-gray-100 border-t border-gray-300 p-2 text-sm text-gray-700">
      <span>{{ selectedItems.size }} item(s) selected</span>
      <span class="mx-2 text-gray-500">|</span>
      <span>{{ sortedNodes.length }} item(s)</span>
    </div>

    <!-- Context Menu -->
    <div v-if="contextMenu.show" 
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48">
      
      <!-- Cut (only when items are selected) -->
      <button v-if="hasSelection" @click="cutSelected(); closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800">
        ✂️ Cut
      </button>
      
      <!-- Copy (only when items are selected) -->
      <button v-if="hasSelection" @click="copySelected(); closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800">
        📋 Copy
      </button>
      
      <!-- Paste (always available if clipboard has content) -->
      <button @click="pasteItems(); closeContextMenu()" 
        :disabled="!clipboard.type"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800">
        📋 Paste
      </button>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1"></div>
      
      <!-- New (always available) -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          📄 New
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button @click="createFile(); closeContextMenu()" 
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800">
            📄 Text Document
          </button>
          <button @click="createDirectory(); closeContextMenu()" 
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800">
            📁 Folder
          </button>
        </div>
      </div>
      
      <div v-if="hasSelection" class="border-t border-gray-200 my-1"></div>
      
      <!-- Rename (only when single item is selected) -->
      <button v-if="hasSingleSelection" @click="renameItem(); closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800">
        ✏️ Rename
      </button>
      
      <!-- Delete (only when items are selected) -->
      <button v-if="hasSelection" @click="deleteSelected(); closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-red-600">
        🗑️ Delete
      </button>
      
      <div class="border-t border-gray-200 my-1"></div>
      
      <!-- Select All (only when there are items to select) -->
      <button @click="selectAll(); closeContextMenu()" 
        :disabled="sortedNodes.length === 0"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800">
        ☑️ Select All
      </button>
      
      <div v-if="hasSingleSelection" class="border-t border-gray-200 my-1"></div>
      
      <!-- Properties (only when single item is selected) -->
      <button v-if="hasSingleSelection" @click="showProperties(); closeContextMenu()" 
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800">
        ⚙️ Properties
      </button>
    </div>
  </div>
</template>
