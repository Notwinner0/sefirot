import { ref, computed } from 'vue';

interface FSNode {
  path: string;
  parent: string;
  name: string;
  type: 'file' | 'directory' | 'symlink';
  createdAt: Date;
  modifiedAt: Date;
  attributes: {
    readOnly: boolean;
    hidden: boolean;
  };
  content?: ArrayBuffer;
  target?: string;
}

export function useFileSelection() {
  const selectedPaths = ref<Set<string>>(new Set());
  const lastSelectedIndex = ref(-1);

  const selectedCount = computed(() => selectedPaths.value.size);
  const hasSelection = computed(() => selectedCount.value > 0);
  const hasSingleSelection = computed(() => selectedCount.value === 1);
  const hasMultipleSelection = computed(() => selectedCount.value > 1);

  const selectItem = (node: FSNode, nodes: FSNode[], event: MouseEvent) => {
    const nodeIndex = nodes.findIndex(n => n.path === node.path);

    if (event.ctrlKey) {
      // Multi-select with Ctrl
      if (selectedPaths.value.has(node.path)) {
        selectedPaths.value.delete(node.path);
      } else {
        selectedPaths.value.add(node.path);
        lastSelectedIndex.value = nodeIndex;
      }
    } else if (event.shiftKey && lastSelectedIndex.value !== -1) {
      // Range select with Shift
      const startIndex = Math.min(lastSelectedIndex.value, nodeIndex);
      const endIndex = Math.max(lastSelectedIndex.value, nodeIndex);

      selectedPaths.value.clear();
      for (let i = startIndex; i <= endIndex; i++) {
        selectedPaths.value.add(nodes[i].path);
      }
    } else {
      // Single select
      selectedPaths.value.clear();
      selectedPaths.value.add(node.path);
      lastSelectedIndex.value = nodeIndex;
    }
  };

  const selectAll = (nodes: FSNode[]) => {
    selectedPaths.value.clear();
    nodes.forEach(node => selectedPaths.value.add(node.path));
    lastSelectedIndex.value = nodes.length - 1;
  };

  const clearSelection = () => {
    selectedPaths.value.clear();
    lastSelectedIndex.value = -1;
  };

  const isSelected = (path: string) => selectedPaths.value.has(path);

  const getSelectedNodes = (allNodes: FSNode[]) => {
    return allNodes.filter(node => selectedPaths.value.has(node.path));
  };

  const selectNext = (nodes: FSNode[]) => {
    if (nodes.length === 0) return;

    let nextIndex = lastSelectedIndex.value + 1;
    if (nextIndex >= nodes.length) nextIndex = 0;

    selectedPaths.value.clear();
    selectedPaths.value.add(nodes[nextIndex].path);
    lastSelectedIndex.value = nextIndex;
  };

  const selectPrevious = (nodes: FSNode[]) => {
    if (nodes.length === 0) return;

    let prevIndex = lastSelectedIndex.value - 1;
    if (prevIndex < 0) prevIndex = nodes.length - 1;

    selectedPaths.value.clear();
    selectedPaths.value.add(nodes[prevIndex].path);
    lastSelectedIndex.value = prevIndex;
  };

  const toggleSelection = (node: FSNode, nodes: FSNode[]) => {
    const nodeIndex = nodes.findIndex(n => n.path === node.path);

    if (selectedPaths.value.has(node.path)) {
      selectedPaths.value.delete(node.path);
      if (lastSelectedIndex.value === nodeIndex) {
        lastSelectedIndex.value = -1;
      }
    } else {
      selectedPaths.value.add(node.path);
      lastSelectedIndex.value = nodeIndex;
    }
  };

  return {
    selectedPaths: computed(() => selectedPaths.value),
    selectedCount,
    hasSelection,
    hasSingleSelection,
    hasMultipleSelection,
    selectItem,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedNodes,
    selectNext,
    selectPrevious,
    toggleSelection
  };
}
