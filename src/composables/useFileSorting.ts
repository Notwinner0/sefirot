import { ref, computed } from 'vue';

export type SortField = 'name' | 'date' | 'type' | 'size';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

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

export function useFileSorting() {
  const sortConfig = ref<SortConfig>({ field: 'name', direction: 'asc' });

  const setSortField = (field: SortField) => {
    if (sortConfig.value.field === field) {
      // Toggle direction if same field
      sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field with ascending direction
      sortConfig.value = { field, direction: 'asc' };
    }
  };

  const sortNodes = (nodes: FSNode[]): FSNode[] => {
    return [...nodes].sort((a, b) => {
      let comparison = 0;

      // Always put directories first, then files/symlinks
      if (a.type !== b.type) {
        if (a.type === 'directory') return -1;
        if (b.type === 'directory') return 1;
        if (a.type === 'file') return -1;
        if (b.type === 'file') return 1;
      }

      switch (sortConfig.value.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
          break;

        case 'date':
          comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
          break;

        case 'type':
          const getTypeString = (node: FSNode) => {
            if (node.type === 'directory') return 'folder';
            if (node.type === 'symlink') return 'shortcut';
            // For files, use extension or 'file'
            const ext = node.name.split('.').pop()?.toLowerCase() || '';
            return ext || 'file';
          };
          comparison = getTypeString(a).localeCompare(getTypeString(b));
          break;

        case 'size':
          // Directories have no size, files have content length or 0
          const aSize = a.type === 'directory' ? -1 : (a.content?.byteLength || 0);
          const bSize = b.type === 'directory' ? -1 : (b.content?.byteLength || 0);
          comparison = aSize - bSize;
          break;

        default:
          comparison = 0;
      }

      return sortConfig.value.direction === 'asc' ? comparison : -comparison;
    });
  };

  const sortedNodes = computed(() => (nodes: FSNode[]) => sortNodes(nodes));

  const getSortIcon = (field: SortField) => {
    if (sortConfig.value.field !== field) return '↕️';
    return sortConfig.value.direction === 'asc' ? '↑' : '↓';
  };

  const getSortLabel = (field: SortField) => {
    const labels = {
      name: 'Name',
      date: 'Date Modified',
      type: 'Type',
      size: 'Size'
    };
    return labels[field];
  };

  return {
    sortConfig: computed(() => sortConfig.value),
    setSortField,
    sortedNodes,
    getSortIcon,
    getSortLabel
  };
}
