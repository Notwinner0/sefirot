import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ContextMenuState {
  isVisible: boolean
  x: number
  y: number
  target: any | null
  component: string
}

export const useContextMenuStore = defineStore('contextMenu', () => {
  const isVisible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const target = ref<any>(null)
  const component = ref('') // Track which component opened the menu

  function open(xPos: number, yPos: number, targetNode: any, componentName: string) {
    // Close any existing menu first (this handles multiple menu prevention)
    close()

    // Open new menu with proper positioning
    isVisible.value = true
    x.value = xPos
    y.value = yPos
    target.value = targetNode
    component.value = componentName
  }

  function close() {
    isVisible.value = false
    target.value = null
    component.value = ''
  }

  function reposition(newX: number, newY: number) {
    x.value = newX
    y.value = newY
  }

  function isOpenBy(componentName: string): boolean {
    return isVisible.value && component.value === componentName
  }

  return {
    isVisible,
    x,
    y,
    target,
    component,
    open,
    close,
    reposition,
    isOpenBy
  }
})
