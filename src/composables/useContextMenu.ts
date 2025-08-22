import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useContextMenuStore } from "../stores/contextMenu";

// Global event listener management with reference counting
let globalEventListenerCount = 0;
let globalClickListener: ((event: MouseEvent) => void) | null = null;
let globalKeyListener: ((event: KeyboardEvent) => void) | null = null;

function handleGlobalClick(event: MouseEvent) {
  const contextMenuStore = useContextMenuStore();
  if (contextMenuStore.isVisible) {
    // Check if click is outside any context menu
    const contextMenuElement = document.querySelector('.context-menu');
    if (contextMenuElement && !contextMenuElement.contains(event.target as Node)) {
      contextMenuStore.close();
    }
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  const contextMenuStore = useContextMenuStore();
  if (event.key === 'Escape' && contextMenuStore.isVisible) {
    contextMenuStore.close();
  }
}

function setupGlobalEventListeners() {
  if (globalEventListenerCount === 0) {
    // Only add listeners if this is the first instance
    globalClickListener = handleGlobalClick;
    globalKeyListener = handleGlobalKeydown;
    document.addEventListener('click', globalClickListener);
    document.addEventListener('keydown', globalKeyListener);
  }
  globalEventListenerCount++;
}

function cleanupGlobalEventListeners() {
  globalEventListenerCount--;
  if (globalEventListenerCount === 0) {
    // Only remove listeners if this is the last instance
    if (globalClickListener) {
      document.removeEventListener('click', globalClickListener);
      globalClickListener = null;
    }
    if (globalKeyListener) {
      document.removeEventListener('keydown', globalKeyListener);
      globalKeyListener = null;
    }
  }
}

export function useContextMenu(componentName: string = '') {
  const contextMenuStore = useContextMenuStore();
  const isLocalMenuVisible = ref(false);

  // Set up global event listener on mount and clean up on unmount
  onMounted(() => {
    if (typeof document !== 'undefined') {
      setupGlobalEventListeners();
    }
  });

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      cleanupGlobalEventListeners();
      // Close menu if this component is unmounting and owns the current menu
      if (contextMenuStore.component === componentName) {
        contextMenuStore.close();
      }
    }
  });

  // Create reactive computed properties for the template
  const contextMenu = computed(() => ({
    show: contextMenuStore.isVisible && contextMenuStore.component === componentName,
    x: contextMenuStore.x,
    y: contextMenuStore.y,
    target: contextMenuStore.target,
    component: contextMenuStore.component
  }));

  // Check if this component's menu is currently active
  const isThisMenuActive = computed(() => contextMenuStore.component === componentName);

  function calculateMenuPosition(event: MouseEvent, menuElement?: HTMLElement, estimatedMenuHeight = 200, estimatedMenuWidth = 192) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 5; // margin from viewport edges

    let x = event.clientX;
    let y = event.clientY;

    // Get actual menu dimensions if element is provided
    let actualMenuHeight = estimatedMenuHeight;
    let actualMenuWidth = estimatedMenuWidth;

    if (menuElement) {
      const menuRect = menuElement.getBoundingClientRect();
      actualMenuHeight = menuRect.height || estimatedMenuHeight;
      actualMenuWidth = menuRect.width || estimatedMenuWidth;
    }

    // Calculate available space
    const spaceAbove = event.clientY;
    const spaceBelow = viewportHeight - event.clientY;

    // Determine best position based on available space
    if (spaceBelow >= actualMenuHeight + margin) {
      // Enough space below - show menu below cursor
      y = event.clientY;
    } else if (spaceAbove >= actualMenuHeight + margin) {
      // Enough space above - show menu above cursor
      y = event.clientY - actualMenuHeight;
    } else {
      // Not enough space in either direction - use the larger space
      if (spaceBelow > spaceAbove) {
        y = event.clientY;
      } else {
        y = event.clientY - actualMenuHeight;
      }
    }

    // Apply boundary checks to keep menu within viewport
    // Horizontal boundary checks
    if (x + actualMenuWidth > viewportWidth) {
      x = viewportWidth - actualMenuWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }

    // Vertical boundary checks - ensure menu stays within viewport
    if (y < margin) {
      y = margin;
    }
    if (y + actualMenuHeight > viewportHeight) {
      y = viewportHeight - actualMenuHeight - margin;
    }

    return { x, y };
  }

  function showContextMenu(event: MouseEvent, targetNode: any | null = null, estimatedMenuHeight?: number, estimatedMenuWidth?: number) {
    // Prevent default browser context menu
    event.preventDefault();
    // Stop event propagation to prevent other handlers from firing
    event.stopImmediatePropagation();

    // Close any existing menu first
    if (contextMenuStore.isVisible && contextMenuStore.component !== componentName) {
      contextMenuStore.close();
    }

    // Small delay to ensure any previous menus are closed
    setTimeout(() => {
      // Initial positioning with estimated dimensions
      const initialPos = calculateMenuPosition(event, undefined, estimatedMenuHeight, estimatedMenuWidth);

      // Use the global store to open the menu
      contextMenuStore.open(initialPos.x, initialPos.y, targetNode, componentName);
      isLocalMenuVisible.value = true;

      // Second tick to measure actual dimensions and reposition if needed
      nextTick(() => {
        const menuElement = document.querySelector('.context-menu') as HTMLElement;
        if (menuElement && contextMenuStore.isVisible && contextMenuStore.component === componentName) {
          const finalPos = calculateMenuPosition(event, menuElement, estimatedMenuHeight, estimatedMenuWidth);

          // Only reposition if the difference is significant (more than 10px)
          if (Math.abs(finalPos.x - contextMenuStore.x) > 10 || Math.abs(finalPos.y - contextMenuStore.y) > 10) {
            contextMenuStore.reposition(finalPos.x, finalPos.y);
          }
        }
      });
    }, 10);
  }

  function closeContextMenu() {
    // Only close if this component owns the current menu
    if (contextMenuStore.component === componentName) {
      contextMenuStore.close();
      isLocalMenuVisible.value = false;
    }
  }

  function forceCloseAllMenus() {
    contextMenuStore.close();
    isLocalMenuVisible.value = false;
  }

  return {
    contextMenu,
    isThisMenuActive,
    showContextMenu,
    closeContextMenu,
    forceCloseAllMenus,
    calculateMenuPosition
  };
}
