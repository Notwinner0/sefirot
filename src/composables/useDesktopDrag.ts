import { ref, reactive, readonly } from 'vue';
import { DESKTOP_CONFIG } from '../config/desktop';
import type { FSNode, SelectionBox, DragState } from '../types/desktop';

export function useDesktopDrag() {
  const { DRAG_THRESHOLD, PADDING, GRID_SIZE } = DESKTOP_CONFIG;

  // State
  const isDragging = ref(false);
  const isMoving = ref(false);
  const isMouseDown = ref(false);
  const hasMoved = ref(false);
  const isGridEnabled = ref(true);

  // Drag state
  const dragState = reactive<DragState>({
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    item: null
  });

  // Selection state
  const selectionBox = reactive<SelectionBox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false
  });

  function startDrag(event: MouseEvent): { type: 'item' | 'selection' | null; itemElement?: Element } {
    if (event.button !== 0) return { type: null };

    isMouseDown.value = true;
    hasMoved.value = false;
    dragState.startPos = { x: event.clientX, y: event.clientY };

    const itemElement = (event.target as HTMLElement).closest('[data-item-path]');

    if (itemElement) {
      return { type: 'item', itemElement };
    } else {
      startSelectionDrag(event);
      return { type: 'selection' };
    }
  }

  function prepareItemDrag(
    itemElement: Element,
    event: MouseEvent,
    desktopItems: FSNode[],
    selectedPaths: ReadonlySet<string>,
    selectItem: (path: string) => void
  ): FSNode | null {
    const path = itemElement.getAttribute('data-item-path');
    if (!path) return null;

    const item = desktopItems.find(i => i.path === path);
    if (!item) return null;

    if (!selectedPaths.has(path)) {
      selectItem(path);
    }

    const rect = itemElement.getBoundingClientRect();
    dragState.offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    return item;
  }

  function startSelectionDrag(event: MouseEvent): void {
    isDragging.value = true;
    dragState.startPos = { x: event.clientX, y: event.clientY };
    selectionBox.x = event.clientX;
    selectionBox.y = event.clientY;
    selectionBox.width = 0;
    selectionBox.height = 0;
    selectionBox.visible = true;
  }

  function onMouseMove(event: MouseEvent): { shouldStartMovement: boolean } {
    if (!isMouseDown.value) return { shouldStartMovement: false };

    dragState.currentPos = { x: event.clientX, y: event.clientY };

    const deltaX = Math.abs(event.clientX - dragState.startPos.x);
    const deltaY = Math.abs(event.clientY - dragState.startPos.y);

    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      hasMoved.value = true;

      if (!isMoving.value && !isDragging.value) {
        return { shouldStartMovement: true };
      }
    }

    if (isMoving.value && dragState.item) {
      // handleItemMovement will be called from the main component with proper arguments
    } else if (isDragging.value) {
      handleSelectionDrag(event);
    }

    return { shouldStartMovement: false };
  }

  function startItemMovement(item: FSNode): void {
    isMoving.value = true;
    dragState.item = item;
  }

  function handleItemMovement(
    event: MouseEvent,
    desktopItems: FSNode[],
    selectedPaths: ReadonlySet<string>,
    moveItems: (items: FSNode[], selectedPaths: ReadonlySet<string>, deltaX: number, deltaY: number, isGridEnabled: boolean) => void
  ): void {
    if (!dragState.item) return;

    let newX = event.clientX - dragState.offset.x;
    let newY = event.clientY - dragState.offset.y;

    if (isGridEnabled.value) {
      newX = Math.round((newX - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING;
      newY = Math.round((newY - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING;
    }

    let deltaX = newX - dragState.item.desktopX!;
    let deltaY = newY - dragState.item.desktopY!;

    if (deltaX === 0 && deltaY === 0) return;

    moveItems(desktopItems, selectedPaths, deltaX, deltaY, isGridEnabled.value);
  }

  function handleSelectionDrag(event: MouseEvent): void {
    const deltaX = event.clientX - dragState.startPos.x;
    const deltaY = event.clientY - dragState.startPos.y;

    selectionBox.x = Math.min(dragState.startPos.x, event.clientX);
    selectionBox.y = Math.min(dragState.startPos.y, event.clientY);
    selectionBox.width = Math.abs(deltaX);
    selectionBox.height = Math.abs(deltaY);
  }

  function selectItemsInBox(
    selectedPaths: ReadonlySet<string>
  ): string[] {
    const desktopElement = document.querySelector('.desktop-container') as HTMLElement;
    if (!desktopElement) return [];

    const itemElements = desktopElement.querySelectorAll('[data-item-path]');
    const pathsToSelect: string[] = [];
    itemElements.forEach((itemElement) => {
      const rect = itemElement.getBoundingClientRect();
      const path = itemElement.getAttribute('data-item-path');

      if (path && rect) {
        const intersects = !(
          rect.right < selectionBox.x ||
          rect.left > selectionBox.x + selectionBox.width ||
          rect.bottom < selectionBox.y ||
          rect.top > selectionBox.y + selectionBox.height
        );

        if (intersects && !selectedPaths.has(path)) {
          pathsToSelect.push(path);
        }
      }
    });
    return pathsToSelect;
  }

  function stopDrag(): { finishedMoving: boolean } {
    isMouseDown.value = false;
    let finishedMoving = false;

    if (hasMoved.value && dragState.item) {
      finishedMoving = true;
      dragState.item = null;
      isMoving.value = false;
    } else if (isDragging.value) {
      isDragging.value = false;
      selectionBox.visible = false;
    }

    // Reset isMoving if it's still true (handles double-click case where hasMoved is false)
    if (isMoving.value) {
      isMoving.value = false;
      dragState.item = null;
    }

    // Defer resetting hasMoved to prevent click event after drag
    setTimeout(() => {
      hasMoved.value = false;
    }, 0);

    return { finishedMoving };
  }

  function toggleGrid(): void {
    isGridEnabled.value = !isGridEnabled.value;
  }

  return {
    // State
    isDragging: readonly(isDragging),
    isMoving: readonly(isMoving),
    isMouseDown: readonly(isMouseDown),
    hasMoved: readonly(hasMoved),
    isGridEnabled: readonly(isGridEnabled),
    dragState: readonly(dragState),
    selectionBox: readonly(selectionBox),

    // Methods
    startDrag,
    prepareItemDrag,
    startSelectionDrag,
    onMouseMove,
    startItemMovement,
    handleItemMovement,
    handleSelectionDrag,
    selectItemsInBox,
    stopDrag,
    toggleGrid
  };
}
