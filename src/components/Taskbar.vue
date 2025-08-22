<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";

const windows = useWindowsStore();
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 h-10 bg-gray-900 text-white flex items-center pr-0">
    <div
      v-for="w in windows.windows"
      :key="w.id"
      @click="w.isMinimized ? windows.restoreWindow(w.id) : windows.minimizeWindow(w.id)"
      class="pl-2 px-3 py-1 rounded cursor-pointer hover:bg-gray-700 flex items-center space-x-2 text-sm"
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
    <div class="ml-auto h-full flex items-center">
      <button 
        @click="windows.minimizeAll()"
        class="h-full w-1 hover:bg-gray-700 flex items-center justify-center text-sm border-l border-gray-700"
      >
        <span class="text-xs">|</span>
      </button>
    </div>
  </div>
</template>
