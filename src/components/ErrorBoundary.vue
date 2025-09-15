<template>
  <div>
    <slot v-if="!hasError" />
    <div v-else class="error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 class="text-red-800 font-semibold mb-2">Something went wrong</h3>
      <p class="text-red-600 text-sm mb-4">{{ error?.message || 'An unexpected error occurred' }}</p>
      <button
        @click="resetError"
        class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        Try again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const error = ref<Error | null>(null)

const resetError = () => {
  hasError.value = false
  error.value = null
}

onErrorCaptured((err: Error) => {
  hasError.value = true
  error.value = err
  console.error('Error boundary caught an error:', err)
  return false // Prevent error from propagating further
})
</script>
