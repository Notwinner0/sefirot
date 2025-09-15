<template>
  <div
    v-if="show"
    :style="{ left: x + 'px', top: y + 'px' }"
    class="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48 context-menu"
  >
    <!-- Open -->
    <button
      v-if="hasSingleSelection"
      @click="$emit('action', 'open')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="openIcon" :size="18" class="mr-2" /> Open
    </button>

    <div v-if="hasSelection" class="border-t border-gray-200 my-1" />

    <!-- Cut -->
    <button
      v-if="hasSelection"
      @click="$emit('action', 'cut')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="cutIcon" :size="18" class="mr-2" /> Cut
    </button>

    <!-- Copy -->
    <button
      v-if="hasSelection"
      @click="$emit('action', 'copy')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="copyIcon" :size="18" class="mr-2" /> Copy
    </button>

    <!-- Paste -->
    <button
      @click="$emit('action', 'paste')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="pasteIcon" :size="18" class="mr-2" /> Paste
    </button>

    <div v-if="hasSelection" class="border-t border-gray-200 my-1" />

    <!-- New -->
    <div class="relative group">
      <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
        <component :is="newIcon" :size="18" class="mr-2" /> New
        <span class="text-xs text-gray-600">▶</span>
      </button>
      <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
        <button
          @click="$emit('action', 'new-file')"
          class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
        >
          <component :is="fileIcon" :size="18" class="mr-2" /> Text Document
        </button>
        <button
          @click="$emit('action', 'new-folder')"
          class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
        >
          <component :is="folderIcon" :size="18" class="mr-2" /> Folder
        </button>
      </div>
    </div>

    <div v-if="hasSelection" class="border-t border-gray-200 my-1" />

    <!-- Rename -->
    <button
      v-if="hasSingleSelection"
      @click="$emit('action', 'rename')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="pencilIcon" :size="18" class="mr-2" /> Rename
    </button>

    <!-- Delete -->
    <button
      v-if="hasSelection"
      @click="$emit('action', 'delete')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-red-600 flex items-center"
    >
      <component :is="deleteIcon" :size="18" class="mr-2" /> Delete
    </button>

    <div class="border-t border-gray-200 my-1" />

    <!-- Select All -->
    <button
      @click="$emit('action', 'select-all')"
      :disabled="!canSelectAll"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 flex items-center"
    >
      <component :is="selectAllIcon" :size="18" class="mr-2" /> Select All
    </button>

    <div v-if="hasSingleSelection" class="border-t border-gray-200 my-1" />

    <!-- Properties -->
    <button
      v-if="hasSingleSelection"
      @click="$emit('action', 'properties')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="cogIcon" :size="18" class="mr-2" /> Properties
    </button>

    <div class="border-t border-gray-200 my-1" />

    <!-- View -->
    <div class="relative group">
      <button class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center text-gray-800">
        <component :is="eyeIcon" :size="18" class="mr-2" /> View
        <span class="text-xs text-gray-600">▶</span>
      </button>
      <div class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-32 hidden group-hover:block">
        <button
          @click="$emit('action', 'toggle-grid')"
          class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center text-gray-800"
        >
          <component :is="gridIcon" :size="18" class="mr-2" />
          Grid
        </button>
      </div>
    </div>

    <div class="border-t border-gray-200 my-1" />

    <!-- Refresh -->
    <button
      @click="$emit('action', 'refresh')"
      class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-800 flex items-center"
    >
      <component :is="refreshIcon" :size="18" class="mr-2" /> Refresh
    </button>
  </div>
</template>

<script setup lang="ts">
import {
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
  CheckboxBlankOutlineIcon
} from '../icons'

interface Props {
  show: boolean
  x: number
  y: number
  hasSelection: boolean
  hasSingleSelection: boolean
  canSelectAll: boolean
  isGridEnabled: boolean
}

interface Emits {
  (e: 'action', action: string): void
}

defineProps<Props>()
defineEmits<Emits>()

// Icon components
const openIcon = OpenInNewIcon
const cutIcon = ContentCutIcon
const copyIcon = ContentCopyIcon
const pasteIcon = ContentPasteIcon
const newIcon = FileDocumentOutlineIcon
const fileIcon = FileDocumentOutlineIcon
const folderIcon = FolderPlusIcon
const pencilIcon = PencilIcon
const deleteIcon = DeleteIcon
const selectAllIcon = CheckboxMarkedOutlineIcon
const cogIcon = CogIcon
const eyeIcon = EyeOutlineIcon
const gridIcon = CheckboxBlankOutlineIcon
const refreshIcon = CogIcon
</script>
