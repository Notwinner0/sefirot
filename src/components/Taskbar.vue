<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";

const windows = useWindowsStore();
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 h-10 bg-gray-900 text-white flex">
    <div
      v-for="w in windows.windows"
      :key="w.id"
      class="px-4 flex items-center"
    >
      {{ w.title }}
    </div>
  </div>
</template>
