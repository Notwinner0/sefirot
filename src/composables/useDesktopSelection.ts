import { ref, computed, readonly } from 'vue';
import type { FSNode } from '../types/desktop';

export function useDesktopSelection() {
  const selectedItems = ref<Set<string>>(new Set());

  const hasSelection = computed(() => selectedItems.value.size > 0);
  const hasSingleSelection = computed(() => selectedItems.value.size === 1);

  function selectItem(path: string) {
    selectedItems.value.clear();
    selectedItems.value.add(path);
  }

  function toggleSelection(path: string) {
    if (selectedItems.value.has(path)) {
      selectedItems.value.delete(path);
    } else {
      selectedItems.value.add(path);
    }
  }

  function selectRange(targetNode: FSNode, desktopItems: FSNode[]) {
    const lastSelectedIndex = desktopItems.findIndex(item =>
      selectedItems.value.has(item.path)
    );
    const currentIndex = desktopItems.findIndex(item =>
      item.path === targetNode.path
    );

    if (lastSelectedIndex !== -1 && currentIndex !== -1) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);

      for (let i = start; i <= end; i++) {
        selectedItems.value.add(desktopItems[i].path);
      }
    }
  }

  function selectAll(desktopItems: FSNode[]) {
    desktopItems.forEach(item => selectedItems.value.add(item.path));
  }

  function clearSelection() {
    selectedItems.value.clear();
  }

  function isSelected(path: string): boolean {
    return selectedItems.value.has(path);
  }

  function getSelectedItems(desktopItems: FSNode[]): FSNode[] {
    return desktopItems.filter(item => selectedItems.value.has(item.path));
  }

  return {
    selectedItems: readonly(selectedItems),
    hasSelection,
    hasSingleSelection,
    selectItem,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedItems
  };
}
