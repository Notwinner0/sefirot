<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";
import FileExplorer from "./FileExplorer.vue";

const windows = useWindowsStore();
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <div
      v-for="w in windows.windows"
      :key="w.id"
      class="absolute top-20 left-20 w-2/3 h-2/3 bg-white border shadow-xl rounded-lg flex flex-col pointer-events-auto"
    >
      <div class="bg-gray-800 text-white p-2 flex justify-between">
        <span>{{ w.title }}</span>
        <button @click="windows.closeApp(w.id)">✖</button>
      </div>

      <div class="flex-1 overflow-hidden">
        <iframe
          v-if="w.content.type === 'iframe'"
          :src="w.content.src"
          class="w-full h-full border-0"
        />
        <component
          v-else
          :is="FileExplorer"
          v-if="w.content.name === 'FileExplorer'"
        />
      </div>
    </div>
  </div>
</template>
