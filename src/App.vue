<script setup lang="ts">
import Desktop from "./components/Desktop.vue";
import WindowManager from "./components/WindowManager.vue";
import Taskbar from "./components/Taskbar.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
</script>

<template>
  <div class="h-screen w-screen relative overflow-hidden">
    <ErrorBoundary>
      <Desktop />
    </ErrorBoundary>
    <ErrorBoundary>
      <WindowManager />
    </ErrorBoundary>
    <ErrorBoundary>
      <Taskbar />
    </ErrorBoundary>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
