<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
// Import the new VFS hook and the FSNode type
import { useWindowsFS } from "../composables/useFS"; // Adjust the import path as needed

// Define the structure for a file system entry (node)
interface FSNode {
  path: string;
  parent: string;
  name: string;
  type: "file" | "directory";
  createdAt: Date;
  modifiedAt: Date;
  attributes: {
    readOnly: boolean;
    hidden: boolean;
  };
  content?: ArrayBuffer;
}

const fs = useWindowsFS();
const currentPath = ref("C:\\");
const nodes = ref<FSNode[]>([]);

/**
 * Loads the contents of a specified directory path into the view.
 * @param path - The directory path to load.
 */
async function loadDirectory(path: string) {
  try {
    // Filter out hidden files unless explicitly configured to show them
    const allNodes = await fs.readdir(path);
    nodes.value = allNodes.filter(node => !node.attributes.hidden);
    currentPath.value = path;
  } catch (error) {
    console.error(`Failed to read directory '${path}':`, error);
    alert(`Error: Could not load directory '${path}'.`);
  }
}

// On component mount, initialize the C: drive and load its contents.
onMounted(async () => {
  await fs.initializeDrive("C");
  await loadDirectory(currentPath.value);
});

/**
 * Handles navigation. If the node is a directory, it loads its contents.
 * @param node - The FSNode to navigate to.
 */
function navigate(node: FSNode) {
  if (node.type === "directory") {
    loadDirectory(node.path);
  } else {
    // In a real app, you might open a file editor here.
    alert(`Opening file: ${node.name}`);
  }
}

/**
 * Creates a new file in the current directory.
 */
async function createFile() {
  const name = prompt("Enter new file name:");
  if (name) {
    const filePath = `${currentPath.value}\\${name}`;
    try {
      // Create an empty file.
      await fs.writeFile(filePath, new ArrayBuffer(0));
      await loadDirectory(currentPath.value); // Refresh view
    } catch (error) {
      console.error(`Failed to create file '${filePath}':`, error);
      alert(`Error: Could not create file.`);
    }
  }
}

/**
 * Creates a new directory in the current directory.
 */
async function createDirectory() {
  const name = prompt("Enter new directory name:");
  if (name) {
    const dirPath = `${currentPath.value}\\${name}`;
    try {
      await fs.mkdir(dirPath);
      await loadDirectory(currentPath.value); // Refresh view
    } catch (error) {
      console.error(`Failed to create directory '${dirPath}':`, error);
      alert(`Error: Could not create directory.`);
    }
  }
}

/**
 * Computes the parent path of the current directory.
 * Returns null if the current path is the root of a drive.
 */
const parentPath = computed(() => {
  if (currentPath.value.endsWith(":\\")) {
    return null; // Root of the drive
  }
  const lastSlashIndex = currentPath.value.lastIndexOf("\\");
  return currentPath.value.substring(0, lastSlashIndex);
});

/**
 * Navigates up to the parent directory.
 */
function goUp() {
  if (parentPath.value) {
    loadDirectory(parentPath.value);
  }
}
</script>

<template>
  <div class="p-4 bg-gray-100 font-sans rounded-lg shadow-md w-full max-w-2xl mx-auto">
    <h2 class="text-xl font-bold mb-2 text-gray-800">File Explorer</h2>

    <!-- Header with current path and navigation -->
    <div class="bg-white p-2 rounded border border-gray-300 mb-3 flex items-center">
      <button
        @click="goUp"
        :disabled="!parentPath"
        class="mr-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ↑ Up
      </button>
      <span class="text-gray-600 font-mono select-all">{{ currentPath }}</span>
    </div>

    <!-- Action Buttons -->
    <div class="mb-3">
      <button @click="createFile" class="mr-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
        New File
      </button>
      <button @click="createDirectory" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
        New Directory
      </button>
    </div>

    <!-- File and Directory Listing -->
    <div class="border border-gray-300 p-2 rounded h-96 overflow-auto bg-white">
      <ul v-if="nodes.length > 0">
        <li
          v-for="node in nodes"
          :key="node.path"
          @dblclick="navigate(node)"
          class="flex items-center p-2 hover:bg-blue-100 rounded cursor-pointer select-none"
          title="Double-click to open"
        >
          <span class="mr-2 text-lg">{{ node.type === 'directory' ? '📁' : '📄' }}</span>
          <span class="font-mono">{{ node.name }}</span>
        </li>
      </ul>
      <div v-else class="text-gray-500 text-center p-4">
        This folder is empty.
      </div>
    </div>
  </div>
</template>
