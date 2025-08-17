<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";

const windows = useWindowsStore();

// function openTheia() {
//   windows.openApp("Theia IDE", { type: "iframe", src: "/theia" });
// }

function openExplorer() {
  windows.openApp("File Explorer", { type: "component", name: "FileExplorer" });
}
</script>

<template>
  <div
    class="absolute inset-0 bg-cover bg-center text-white p-4"
    style="background-image: url('/src/assets/bg.jpg')"
  >
    <div class="space-y-4">
      <!-- <button @click="openTheia" class="block">📝 Theia IDE</button> -->
      <button @click="openExplorer" class="block">📂 File Explorer</button>
    </div>
  </div>
</template>
