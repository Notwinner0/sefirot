<template>
  <div
    :data-item-path="item.path"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu.stop="handleContextMenu"
    :class="[
      'absolute w-20 h-20 p-2 rounded hover:bg-white/10 cursor-pointer text-center transition-colors flex flex-col justify-center items-center',
      isSelected ? 'bg-blue-500/20 border-2 border-blue-400' : '',
      isMoving && isSelected ? 'opacity-50 scale-95' : ''
    ]"
    :style="{
      left: item.desktopX + 'px',
      top: item.desktopY + 'px'
    }"
  >
    <div class="relative">
      <component :is="iconComponent" :size="iconSize" :fillColor="iconColor" class="mb-1" />
      <component
        v-if="item.type === 'symlink'"
        :is="linkIcon"
        :size="16"
        fillColor="#FFFFFF"
        class="absolute bottom-0 left-0 -mb-1 -ml-1 bg-blue-500 rounded-full p-0.5"
      />
    </div>
    <div class="text-xs font-medium break-words leading-tight text-white drop-shadow-lg hover:text-gray-500 hover:drop-shadow-none">
      {{ displayName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FSNode } from '../types/desktop'
import { getIconColorForFile, getIconForFile } from '../utils/iconColors'
import { FolderOpenIcon, LinkIcon } from '../icons'

interface Props {
  item: FSNode
  iconSize: number
  isSelected: boolean
  isMoving: boolean
}

interface Emits {
  (e: 'click', item: FSNode, event: MouseEvent): void
  (e: 'dblclick', item: FSNode): void
  (e: 'itemcontextmenu', item: FSNode, event: MouseEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const iconComponent = computed(() => {
  switch (props.item.type) {
    case 'directory':
      return FolderOpenIcon
    case 'symlink':
      return FolderOpenIcon // Use FolderOpenIcon for symlinks
    default:
      return getIconForFile(props.item.name)
  }
})

const iconColor = computed(() => {
  switch (props.item.type) {
    case 'directory':
      return '#FFCA28' // Amber for folders
    case 'symlink':
      return '#03A9F4' // Light Blue for symlinks
    case 'file':
      return getIconColorForFile(props.item.name)
    default:
      return '#FFFFFF' // Default white
  }
})

const displayName = computed(() => {
  // Could use a composable here for display name logic
  return props.item.name
})

const linkIcon = computed(() => LinkIcon)

const handleClick = (event: MouseEvent) => {
  emit('click', props.item, event)
}

const handleDoubleClick = () => {
  emit('dblclick', props.item)
}

const handleContextMenu = (event: MouseEvent) => {
  emit('itemcontextmenu', props.item, event)
}
</script>
