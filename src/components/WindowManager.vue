<script setup lang="ts">
import { useWindowsStore } from "../stores/windows";
import FileExplorer from "./FileExplorer.vue";
import { ref, onMounted, onUnmounted } from "vue";

const windows = useWindowsStore();
const draggingWindow = ref<string | null>(null);
const resizingWindow = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const resizeDirection = ref<string>('');

onMounted(() => {
  windows.loadPositions();
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});

const focusWindow = (windowId: string) => {
  windows.focusWindow(windowId);
};

const startDrag = (event: MouseEvent, windowId: string) => {
  const windowObj = windows.windows.find(w => w.id === windowId);
  if (!windowObj) return;
  
  // Focus the window when starting to drag
  focusWindow(windowId);
  
  draggingWindow.value = windowId;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  
  event.preventDefault();
  event.stopPropagation();
};

const startResize = (event: MouseEvent, windowId: string, direction: string) => {
  // Focus the window when starting to resize
  focusWindow(windowId);
  
  resizingWindow.value = windowId;
  resizeDirection.value = direction;
  event.preventDefault();
  event.stopPropagation();
};

const onMouseMove = (event: MouseEvent) => {
  if (draggingWindow.value) {
    const newX = event.clientX - dragOffset.value.x;
    const newY = event.clientY - dragOffset.value.y;
    
    // Keep window within viewport bounds
    const windowObj = windows.windows.find(w => w.id === draggingWindow.value);
    if (windowObj) {
      const maxX = window.innerWidth - (windowObj.width || 400);
      const maxY = window.innerHeight - (windowObj.height || 300);
      
      windows.updateWindowPosition(
        draggingWindow.value,
        Math.max(0, Math.min(newX, maxX)),
        Math.max(0, Math.min(newY, maxY))
      );
    }
  }
  
  if (resizingWindow.value) {
    const windowObj = windows.windows.find(w => w.id === resizingWindow.value);
    if (!windowObj) return;
    
    let newWidth = windowObj.width || 400;
    let newHeight = windowObj.height || 300;
    
    if (resizeDirection.value.includes('e')) {
      newWidth = Math.max(300, event.clientX - windowObj.x);
    }
    if (resizeDirection.value.includes('s')) {
      newHeight = Math.max(200, event.clientY - windowObj.y);
    }
    
    // Keep within viewport bounds
    newWidth = Math.min(newWidth, window.innerWidth - windowObj.x);
    newHeight = Math.min(newHeight, window.innerHeight - windowObj.y);
    
    windows.updateWindowSize(resizingWindow.value, newWidth, newHeight);
  }
};

const onMouseUp = () => {
  draggingWindow.value = null;
  resizingWindow.value = null;
  resizeDirection.value = '';
};
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <div
      v-for="w in windows.windows"
      :key="w.id"
      v-show="!w.isMinimized"
      :style="{
        left: w.x + 'px',
        top: w.y + 'px',
        width: w.isMaximized ? '100%' : (w.width ? w.width + 'px' : '66.666667%'),
        height: w.isMaximized ? '100%' : (w.height ? w.height + 'px' : '66.666667%'),
        zIndex: w.zIndex || 10
      }"
      class="absolute bg-white border shadow-xl rounded-lg flex flex-col pointer-events-auto"
      @mousedown="focusWindow(w.id)"
    >
      <div 
        class="bg-gray-800 text-white p-2 flex justify-between cursor-move select-none"
        @mousedown="startDrag($event, w.id)"
      >
        <span>{{ w.title }}</span>
        <div class="flex space-x-1">
          <button 
            @click="windows.minimizeWindow(w.id)" 
            class="hover:bg-gray-700 px-1 rounded text-xs"
            title="Minimize"
          >─</button>
          <button 
            @click="windows.maximizeWindow(w.id)" 
            class="hover:bg-gray-700 px-1 rounded text-xs"
            :title="w.isMaximized ? 'Restore' : 'Maximize'"
          >{{ w.isMaximized ? '❐' : '⬜' }}</button>
          <button 
            @click="windows.closeApp(w.id)" 
            class="hover:bg-red-600 px-1 rounded text-xs"
            title="Close"
          >✖</button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden relative">
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
        
        <!-- Resize handles - only show when not maximized -->
        <template v-if="!w.isMaximized">
          <div 
            class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            @mousedown="startResize($event, w.id, 'se')"
          ></div>
          <div 
            class="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
            @mousedown="startResize($event, w.id, 'sw')"
          ></div>
          <div 
            class="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
            @mousedown="startResize($event, w.id, 'ne')"
          ></div>
          <div 
            class="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
            @mousedown="startResize($event, w.id, 'nw')"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>
