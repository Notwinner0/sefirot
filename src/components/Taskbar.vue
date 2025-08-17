<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";

const windows = useWindowsStore();
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 h-10 bg-gray-900 text-white flex items-center px-2 space-x-1">
    <div
      v-for="w in windows.windows"
      :key="w.id"
      @click="w.isMinimized ? windows.restoreWindow(w.id) : windows.minimizeWindow(w.id)"
      class="px-3 py-1 rounded cursor-pointer hover:bg-gray-700 flex items-center space-x-2 text-sm"
      :class="{
        'bg-gray-700': !w.isMinimized,
        'bg-gray-800': w.isMinimized
      }"
    >
      <span class="text-xs">📁</span>
      <span>{{ w.title }}</span>
      <button 
        @click.stop="windows.closeApp(w.id)"
        class="ml-2 hover:bg-red-600 px-1 rounded text-xs"
      >✖</button>
    </div>
  </div>
</template>
