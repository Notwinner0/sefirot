<template>
  <div
    v-if="visible"
    class="fixed border-2 border-blue-400 bg-blue-400/10 pointer-events-none z-40"
    :style="{
      left: x + 'px',
      top: y + 'px',
      width: width + 'px',
      height: height + 'px'
    }"
  />
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  x: number
  y: number
  width: number
  height: number
}

defineProps<Props>()
</script>
