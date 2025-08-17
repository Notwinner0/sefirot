<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useFS } from "../composables/useFS";

const fs = useFS();
const files = ref<string[]>([]);

onMounted(async () => {
  files.value = await fs.readdir("/");
});

async function createFile() {
  const name = prompt("File name?");
  if (name) {
    await fs.writeFile("/" + name, "Hello world!");
    files.value = await fs.readdir("/");
  }
}
</script>

<template>
  <div class="p-4">
    <h2 class="font-bold mb-2">File Explorer</h2>
    <button @click="createFile" class="mb-2 bg-blue-500 text-white px-2 py-1">
      New File
    </button>
    <ul class="border p-2 h-full overflow-auto">
      <li v-for="f in files" :key="f">{{ f }}</li>
    </ul>
  </div>
</template>
