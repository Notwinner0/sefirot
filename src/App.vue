<script setup lang="ts">
import Desktop from "./components/Desktop.vue";
import WindowManager from "./components/WindowManager.vue";
import Taskbar from "./components/Taskbar.vue";
</script>

<template>
  <div class="h-screen w-screen relative overflow-hidden">
    <Desktop />
    <WindowManager />
    <Taskbar />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
