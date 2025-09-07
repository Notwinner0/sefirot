<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useWindowsFS } from "../composables/useFS";
import { useWindowsStore } from "../stores/windows";

import { useContextMenu } from "../composables/useContextMenu";

// Import new composables
import { useFileOperations } from "../composables/useFileOperations";
import { useFileSorting } from "../composables/useFileSorting";
import { useFileSelection } from "../composables/useFileSelection";
import { useNotifications } from "../composables/useNotifications";

// Import Icons
import {
  FolderOpenIcon,
  LinkIcon,
  FileDocumentIcon,
  OpenInNewIcon,
  ContentCutIcon,
  ContentCopyIcon,
  ContentPasteIcon,
  FileDocumentOutlineIcon,
  FolderPlusIcon,
  PencilIcon,
  DeleteIcon,
  CheckboxMarkedOutlineIcon,
  CogIcon,
  EyeOutlineIcon,
  ArrowUpBoldIcon,
  HomeIcon,
  CloseIcon
} from '../icons';

// Import icon utilities
import { getIconColorForFile, getIconForFile } from '../utils/iconColors';

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

const props = defineProps<{
  initialPath?: string;
}>();

// Core state
const fs = useWindowsFS();
const currentPath = ref("C:\\");
const nodes = ref<FSNode[]>([]);
const viewMode = ref<'details' | 'list' | 'icons'>('details');
const showHidden = ref(false);
const isLoading = ref(false);

// Address bar state
const isEditingAddress = ref(false);
const editableAddress = ref("");
const addressInput = ref<HTMLInputElement | null>(null);
const addressBarRef = ref<HTMLDivElement | null>(null);

// Clipboard for cut/copy operations
const clipboard = ref<{
  type: 'cut' | 'copy' | null;
  items: FSNode[];
}>({
  type: null,
  items: []
});

// Initialize composables
const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu('FileExplorer');
const fileOps = useFileOperations();
const { setSortField, sortedNodes } = useFileSorting();
const {
  selectedCount,
  hasSelection,
  hasSingleSelection,
  selectItem,
  selectAll,
  clearSelection,
  isSelected,
  getSelectedNodes
} = useFileSelection();
const { error: showError, success: showSuccess } = useNotifications();

async function loadDirectory(path: string) {
  isLoading.value = true;
  try {
    const allNodes = await fs.readdir(path);
    nodes.value = allNodes.filter(node => showHidden.value || !node.attributes.hidden);
    currentPath.value = path;
    clearSelection();
  } catch (error) {
    console.error(`Failed to read directory '${path}':`, error);
    showError('Failed to Load Directory', `Could not load directory '${path}'.`);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await fs.initializeDrive("C");
  await loadDirectory(props.initialPath || "C:\\");

  // Note: Context menu global click handling is now managed by the useContextMenu composable
  document.addEventListener('click', handleClickOutsideAddressBar);
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
      showError('Symlink Navigation', `Opening symlink: ${node.name} -> ${node.target}`);
    }
  } else {
    showError('File Opening', `Opening file: ${node.name}\n(This is a placeholder - file opening not implemented)`);
  }
}

function handleClickOutsideAddressBar(event: MouseEvent) {
  if (isEditingAddress.value && addressBarRef.value && !addressBarRef.value.contains(event.target as Node)) {
    stopEditingAddress();
  }
}

async function createFile() {
  const name = prompt("Enter new file name:");
  if (!name?.trim()) return;

  const result = await fileOps.createFile(currentPath.value, name.trim());
  if (result.success) {
    showSuccess('File Created', `Successfully created file '${name}'`);
    await loadDirectory(currentPath.value);
  } else {
    showError('Failed to Create File', result.error || 'Unknown error occurred');
  }
}

async function createDirectory() {
  const name = prompt("Enter new directory name:");
  if (!name?.trim()) return;

  const result = await fileOps.createDirectory(currentPath.value, name.trim());
  if (result.success) {
    showSuccess('Directory Created', `Successfully created directory '${name}'`);
    await loadDirectory(currentPath.value);
  } else {
    showError('Failed to Create Directory', result.error || 'Unknown error occurred');
  }
}

async function deleteSelected() {
  if (!hasSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  if (confirm(`Delete ${selectedNodes.length} item(s)? This action cannot be undone.`)) {
    const paths = selectedNodes.map(node => node.path);
    const result = await fileOps.deleteItems(paths);

    if (result.success) {
      showSuccess('Items Deleted', `Successfully deleted ${selectedNodes.length} item(s)`);
      await loadDirectory(currentPath.value);
    } else {
      showError('Failed to Delete Items', result.error || 'Unknown error occurred');
    }
  }
}

async function cutSelected() {
  if (!hasSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  clipboard.value = {
    type: 'cut',
    items: selectedNodes
  };
  showSuccess('Items Cut', `${selectedNodes.length} item(s) cut to clipboard`);
}

async function copySelected() {
  if (!hasSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  clipboard.value = {
    type: 'copy',
    items: selectedNodes
  };
  showSuccess('Items Copied', `${selectedNodes.length} item(s) copied to clipboard`);
}

async function pasteItems() {
  if (!clipboard.value.type || clipboard.value.items.length === 0) return;

  const isMove = clipboard.value.type === 'cut';
  const selectedNodes = clipboard.value.items;
  const paths = selectedNodes.map(node => node.path);

  const result = await fileOps.copyItems(paths, currentPath.value, isMove);

  if (result.success) {
    const action = isMove ? 'moved' : 'copied';
    showSuccess('Items Pasted', `Successfully ${action} ${selectedNodes.length} item(s)`);

    // Clear clipboard after move operation
    if (isMove) {
      clipboard.value = { type: null, items: [] };
    }

    await loadDirectory(currentPath.value);
  } else {
    showError('Failed to Paste Items', result.error || 'Unknown error occurred');
  }
}

async function renameItem() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  const node = selectedNodes[0];
  const newName = prompt("Enter new name:", node.name);

  if (newName && newName !== node.name) {
    const result = await fileOps.renameItem(node.path, newName.trim());

    if (result.success) {
      showSuccess('Item Renamed', `Successfully renamed '${node.name}' to '${newName}'`);
      await loadDirectory(currentPath.value);
    } else {
      showError('Failed to Rename Item', result.error || 'Unknown error occurred');
    }
  }
}

function showProperties() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
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

// Context menu functions
function openItem() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  const node = selectedNodes[0];

  if (node.type === 'directory') {
    loadDirectory(node.path);
  } else {
    showError('File Opening', `Opening file: ${node.name}\n(This is a placeholder - file opening not implemented)`);
  }
}

function editItem() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  const node = selectedNodes[0];

  if (node.type === 'file') {
    showError('File Editing', `Editing file: ${node.name}\n(This is a placeholder - file editing not implemented)`);
  } else {
    showError('Edit Error', 'Cannot edit directories');
  }
}

function printItem() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  showError('Print', `Printing: ${selectedNodes[0].name}\n(This is a placeholder - printing not implemented)`);
}

function createShortcut() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  showError('Create Shortcut', `Creating shortcut for: ${selectedNodes[0].name}\n(This is a placeholder - shortcut creation not implemented)`);
}

function openWith() {
  if (!hasSingleSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  const node = selectedNodes[0];

  if (node.type === 'file') {
    showError('Open With', `Opening "${node.name}" with...\n(This is a placeholder - open with not implemented)`);
  }
}

function sendToDesktop() {
  if (!hasSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  showError('Send to Desktop', `Sending ${selectedNodes.length} item(s) to Desktop\n(This is a placeholder - send to not implemented)`);
}

function sendToDocuments() {
  if (!hasSelection.value) return;

  const selectedNodes = getSelectedNodes(nodes.value);
  showError('Send to Documents', `Sending ${selectedNodes.length} item(s) to Documents\n(This is a placeholder - send to not implemented)`);
}

function refreshDirectory() {
  loadDirectory(currentPath.value);
}

function sortByName() {
  setSortField('name');
  showSuccess('Sort Applied', 'Sorted by name');
}

function sortByDate() {
  setSortField('date');
  showSuccess('Sort Applied', 'Sorted by date modified');
}

function sortByType() {
  setSortField('type');
  showSuccess('Sort Applied', 'Sorted by type');
}

function sortBySize() {
  setSortField('size');
  showSuccess('Sort Applied', 'Sorted by size');
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

function startEditingAddress() {
  isEditingAddress.value = true;
  editableAddress.value = currentPath.value;
  nextTick(() => {
    addressInput.value?.focus();
  });
}

function stopEditingAddress() {
  isEditingAddress.value = false;
}

async function handleAddressChange() {
  try {
    const stats = await fs.stat(editableAddress.value);
    if (stats && stats.type === 'directory') {
      loadDirectory(editableAddress.value);
      isEditingAddress.value = false;
    } else {
      alert(`Error: Path is not a directory '${editableAddress.value}'.`);
    }
  } catch (error) {
    alert(`Error: Path not found '${editableAddress.value}'.`);
  }
}



function formatDate(date: Date) {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(node: FSNode) {
  if (node.type === 'directory') {
    return FolderOpenIcon;
  } else if (node.type === 'symlink') {
    return LinkIcon;
  }
  // Use the centralized icon system that returns actual Vue components
  return getIconForFile(node.name);
}

function getFileIconColor(node: FSNode) {
  if (node.type === 'directory') {
    return '#FFCA28'; // Amber for folders
  } else if (node.type === 'symlink') {
    return '#03A9F4'; // Light Blue for symlinks
  }
  // Use the centralized color system for files
  return getIconColorForFile(node.name);
}
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Toolbar -->
    <div class="bg-gray-100 border-b border-gray-300 p-2 flex items-center space-x-2">
      <button @click="goUp" :disabled="!parentPath" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-800 flex items-center">
        <ArrowUpBoldIcon :size="16" fillColor="#606060" class="mr-1" /> Up
      </button>
      <button @click="goHome" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-800 flex items-center">
        <HomeIcon :size="16" fillColor="#606060" class="mr-1" /> Home
      </button>
      <div class="w-px h-6 bg-gray-300"></div>
      <button @click="createFile" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-800 flex items-center">
        <FileDocumentOutlineIcon :size="16" fillColor="#606060" class="mr-1" /> New File
      </button>
      <button @click="createDirectory" 
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-800 flex items-center">
        <FolderPlusIcon :size="16" fillColor="#606060" class="mr-1" /> New Folder
      </button>
      <button @click="deleteSelected" :disabled="!hasSelection"
        class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-800 flex items-center">
        <DeleteIcon :size="16" fillColor="#606060" class="mr-1" /> Delete
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
        <div class="flex-1 bg-white border border-gray-300 rounded px-2 py-1" @click="startEditingAddress" ref="addressBarRef">
          <input
            v-if="isEditingAddress"
            ref="addressInput"
            v-model="editableAddress"
            @keydown.enter="handleAddressChange"
            class="w-full text-sm font-mono text-gray-900 bg-transparent outline-none"
          />
          <span v-else class="text-sm font-mono text-gray-900">{{ currentPath }}</span>
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
      <div v-if="viewMode === 'details' && sortedNodes(nodes).length > 0" class="w-full">
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
            <tr v-for="node in sortedNodes(nodes)" :key="node.path"
              @click="selectItem(node, sortedNodes(nodes), $event)"
              @dblclick="navigate(node)"
              @contextmenu.stop="showContextMenu($event, node)"
              :class="['border-b border-gray-100 hover:bg-blue-50 cursor-pointer',
                isSelected(node.path) ? 'bg-blue-100' : '']">
              <td class="p-2 flex items-center">
                <component :is="getFileIcon(node)" :size="20" :fillColor="getFileIconColor(node)" class="mr-2" />
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
      <div v-else-if="viewMode === 'list' && sortedNodes(nodes).length > 0" class="p-2">
        <div class="grid grid-cols-1 gap-1">
          <div v-for="node in sortedNodes(nodes)" :key="node.path"
            @click="selectItem(node, sortedNodes(nodes), $event)"
            @dblclick="navigate(node)"
            @contextmenu.stop="showContextMenu($event, node)"
            :class="['p-2 rounded hover:bg-blue-50 cursor-pointer flex items-center',
              isSelected(node.path) ? 'bg-blue-100' : '']">
            <component :is="getFileIcon(node)" :size="20" :fillColor="getFileIconColor(node)" class="mr-2" />
            <span class="font-medium text-gray-900">{{ node.name }}</span>
          </div>
        </div>
      </div>

      <!-- Icons View -->
      <div v-else-if="viewMode === 'icons' && sortedNodes(nodes).length > 0" class="p-4">
        <div class="grid grid-cols-6 gap-4">
          <div v-for="node in sortedNodes(nodes)" :key="node.path"
            @click="selectItem(node, sortedNodes(nodes), $event)"
            @dblclick="navigate(node)"
            @contextmenu.stop="showContextMenu($event, node)"
            :class="['p-3 rounded hover:bg-blue-50 cursor-pointer text-center',
              isSelected(node.path) ? 'bg-blue-100' : '']">
            <div class="text-3xl mb-2">
              <component :is="getFileIcon(node)" :size="32" :fillColor="getFileIconColor(node)" />
            </div>
            <div class="text-xs font-medium break-words text-gray-900">{{ node.name }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="sortedNodes(nodes).length === 0" class="flex items-center justify-center h-full text-gray-600">
        <div class="text-center flex flex-col items-center">
          <div class="mb-2 flex items-center justify-center">
            <FolderOpenIcon :size="48" fillColor="#FFCA28" />
          </div>
          <div class="text-gray-700">This folder is empty</div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="bg-gray-100 border-t border-gray-300 p-2 text-sm text-gray-700">
      <span>{{ selectedCount }} item(s) selected</span>
      <span class="mx-2 text-gray-500">|</span>
      <span>{{ sortedNodes(nodes).length }} item(s)</span>
    </div>

    <!-- Context Menu -->
    <div v-if="contextMenu.show"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48 context-menu">

      <!-- Open (only when single item is selected) -->
      <button v-if="hasSingleSelection" @click="closeContextMenu(); openItem()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <OpenInNewIcon :size="18" class="mr-2" /> Open
      </button>

      <!-- Edit (only when single file is selected) -->
      <button v-if="hasSingleSelection && getSelectedNodes(nodes)[0]?.type === 'file'" @click="closeContextMenu(); editItem()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <PencilIcon :size="18" class="mr-2" /> Edit
      </button>

      <div v-if="hasSelection" class="border-t border-gray-200 my-1"></div>

      <!-- Cut (only when items are selected) -->
      <button v-if="hasSelection" @click="cutSelected(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <ContentCutIcon :size="18" class="mr-2" /> Cut
      </button>

      <!-- Copy (only when items are selected) -->
      <button v-if="hasSelection" @click="copySelected(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <ContentCopyIcon :size="18" class="mr-2" /> Copy
      </button>

      <!-- Paste (always available if clipboard has content) -->
      <button @click="pasteItems(); closeContextMenu()"
        :disabled="!clipboard.type"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 flex items-center">
        <ContentPasteIcon :size="18" class="mr-2" /> Paste
      </button>

      <div class="border-t border-gray-200 my-1"></div>

      <!-- New (always available) -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          <FileDocumentOutlineIcon :size="18" class="mr-2" /> New
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button @click="createFile(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FileDocumentOutlineIcon :size="18" class="mr-2" /> Text Document
          </button>
          <button @click="createDirectory(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FolderPlusIcon :size="18" class="mr-2" /> Folder
          </button>
        </div>
      </div>

      <div v-if="hasSelection" class="border-t border-gray-200 my-1"></div>

      <!-- Print (only when single file is selected) -->
      <button v-if="hasSingleSelection && getSelectedNodes(nodes)[0]?.type === 'file'" @click="printItem(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <FileDocumentIcon :size="18" class="mr-2" /> Print
      </button>

      <!-- Send to (submenu) -->
      <div v-if="hasSelection" class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          <ContentCopyIcon :size="18" class="mr-2" /> Send to
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button @click="sendToDesktop(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FolderOpenIcon :size="18" class="mr-2" /> Desktop (create shortcut)
          </button>
          <button @click="sendToDocuments(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FolderOpenIcon :size="18" class="mr-2" /> Documents
          </button>
        </div>
      </div>

      <!-- Create shortcut (only when single item is selected) -->
      <button v-if="hasSingleSelection" @click="createShortcut(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <LinkIcon :size="18" class="mr-2" /> Create shortcut
      </button>

      <div v-if="hasSelection" class="border-t border-gray-200 my-1"></div>

      <!-- Rename (only when single item is selected) -->
      <button v-if="hasSingleSelection" @click="renameItem(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <PencilIcon :size="18" class="mr-2" /> Rename
      </button>

      <!-- Delete (only when items are selected) -->
      <button v-if="hasSelection" @click="deleteSelected(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-red-600 flex items-center">
        <DeleteIcon :size="18" class="mr-2" /> Delete
      </button>

      <div class="border-t border-gray-200 my-1"></div>

      <!-- View (submenu) -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          <EyeOutlineIcon :size="18" class="mr-2" /> View
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button @click="viewMode = 'icons'; closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FolderOpenIcon :size="18" class="mr-2" /> Icons
          </button>
          <button @click="viewMode = 'list'; closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <EyeOutlineIcon :size="18" class="mr-2" /> List
          </button>
          <button @click="viewMode = 'details'; closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FileDocumentIcon :size="18" class="mr-2" /> Details
          </button>
        </div>
      </div>

      <!-- Sort by (submenu) -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
          <ArrowUpBoldIcon :size="18" class="mr-2" /> Sort by
          <span class="text-xs text-gray-600">▶</span>
        </button>
        <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
          <button @click="sortByName(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FileDocumentIcon :size="18" class="mr-2" /> Name
          </button>
          <button @click="sortByDate(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FileDocumentIcon :size="18" class="mr-2" /> Date modified
          </button>
          <button @click="sortByType(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FileDocumentIcon :size="18" class="mr-2" /> Type
          </button>
          <button @click="sortBySize(); closeContextMenu()"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
            <FileDocumentIcon :size="18" class="mr-2" /> Size
          </button>
        </div>
      </div>

      <!-- Refresh -->
      <button @click="refreshDirectory(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <CogIcon :size="18" class="mr-2" /> Refresh
      </button>

      <div class="border-t border-gray-200 my-1"></div>

      <!-- Open with (only when single file is selected) -->
      <button v-if="hasSingleSelection && getSelectedNodes(nodes)[0]?.type === 'file'" @click="openWith(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <CloseIcon :size="18" class="mr-2" /> Open with
      </button>

      <!-- Select All (only when there are items to select) -->
      <button @click="selectAll(nodes); closeContextMenu()"
        :disabled="sortedNodes(nodes).length === 0"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 flex items-center">
        <CheckboxMarkedOutlineIcon :size="18" class="mr-2" /> Select All
      </button>

      <div v-if="hasSingleSelection" class="border-t border-gray-200 my-1"></div>

      <!-- Properties (only when single item is selected) -->
      <button v-if="hasSingleSelection" @click="showProperties(); closeContextMenu()"
        class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center">
        <CogIcon :size="18" class="mr-2" /> Properties
      </button>
    </div>
  </div>
</template>
