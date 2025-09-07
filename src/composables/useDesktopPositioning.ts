import { DESKTOP_CONFIG } from '../config/desktop';
import type { FSNode, Position } from '../types/desktop';

export function useDesktopPositioning() {
  const { GRID_SIZE, PADDING, ICON_SIZE } = DESKTOP_CONFIG;

  function snapToGrid(x: number, y: number, isGridEnabled: boolean): Position {
    if (!isGridEnabled) return { x, y };

    return {
      x: Math.round((x - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING,
      y: Math.round((y - PADDING) / GRID_SIZE) * GRID_SIZE + PADDING
    };
  }

  function assignDefaultPositions(items: FSNode[]): void {
    const occupiedPositions = new Set<string>();

    // First, snap existing items to the grid and record their positions
    items.forEach(item => {
      if (item.desktopX !== undefined && item.desktopY !== undefined) {
        const snapped = snapToGrid(item.desktopX, item.desktopY, true);
        item.desktopX = snapped.x;
        item.desktopY = snapped.y;
        occupiedPositions.add(`${snapped.x},${snapped.y}`);
      }
    });

    // Now, place new items in the first available spot
    items.forEach(item => {
      if (item.desktopX === undefined || item.desktopY === undefined) {
        const { x, y } = findNextAvailablePosition(PADDING, PADDING, occupiedPositions);
        item.desktopX = x;
        item.desktopY = y;
        occupiedPositions.add(`${x},${y}`);
      }
    });

    // Finally, resolve any stacking that might have occurred from snapping
    resolveStacking(items);
  }

  function findNextAvailablePosition(startX: number, startY: number, occupied: Set<string>): Position {
    let x = PADDING;
    let y = PADDING;
    const maxCols = Math.floor((window.innerWidth - PADDING * 2) / GRID_SIZE);
    const maxRows = Math.floor((window.innerHeight - PADDING * 2) / GRID_SIZE);

    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < maxCols; c++) {
        x = PADDING + c * GRID_SIZE;
        y = PADDING + r * GRID_SIZE;
        if (!occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }
    // Fallback if screen is full
    return { x: startX, y: startY };
  }

  function resolveStacking(items: FSNode[]): void {
    const positions = new Map<string, FSNode[]>();
    items.forEach(item => {
      const key = `${item.desktopX},${item.desktopY}`;
      if (!positions.has(key)) {
        positions.set(key, []);
      }
      positions.get(key)!.push(item);
    });

    const occupiedSet = new Set(positions.keys());

    positions.forEach((stackedItems) => {
      if (stackedItems.length > 1) {
        // Keep the first item, move the rest
        stackedItems.slice(1).forEach(itemToMove => {
          const { x, y } = findNextAvailablePosition(
            itemToMove.desktopX!,
            itemToMove.desktopY!,
            occupiedSet
          );
          itemToMove.desktopX = x;
          itemToMove.desktopY = y;
          occupiedSet.add(`${x},${y}`);
        });
      }
    });
  }

  function constrainToViewport(
    items: FSNode[],
    selectedPaths: ReadonlySet<string>,
    deltaX: number,
    deltaY: number
  ): { deltaX: number; deltaY: number } {
    // Find the bounding box of the entire selection
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    items.forEach(item => {
      if (selectedPaths.has(item.path)) {
        minX = Math.min(minX, item.desktopX!);
        minY = Math.min(minY, item.desktopY!);
        maxX = Math.max(maxX, item.desktopX!);
        maxY = Math.max(maxY, item.desktopY!);
      }
    });

    let constrainedDeltaX = deltaX;
    let constrainedDeltaY = deltaY;

    // Adjust delta to keep the entire selection within the viewport
    if (minX + deltaX < PADDING) {
      constrainedDeltaX = PADDING - minX;
    }
    if (maxX + deltaX > window.innerWidth - ICON_SIZE - PADDING) {
      constrainedDeltaX = window.innerWidth - ICON_SIZE - PADDING - maxX;
    }
    if (minY + deltaY < PADDING) {
      constrainedDeltaY = PADDING - minY;
    }
    if (maxY + deltaY > window.innerHeight - ICON_SIZE - PADDING) {
      constrainedDeltaY = window.innerHeight - ICON_SIZE - PADDING - maxY;
    }

    return { deltaX: constrainedDeltaX, deltaY: constrainedDeltaY };
  }

  function moveItems(
    items: FSNode[],
    selectedPaths: ReadonlySet<string>,
    deltaX: number,
    deltaY: number,
    isGridEnabled: boolean
  ): void {
    const constrained = constrainToViewport(items, selectedPaths, deltaX, deltaY);

    items.forEach(item => {
      if (selectedPaths.has(item.path)) {
        let newX = item.desktopX! + constrained.deltaX;
        let newY = item.desktopY! + constrained.deltaY;

        if (isGridEnabled) {
          const snapped = snapToGrid(newX, newY, true);
          newX = snapped.x;
          newY = snapped.y;
        }

        item.desktopX = newX;
        item.desktopY = newY;
      }
    });
  }

  return {
    snapToGrid,
    assignDefaultPositions,
    findNextAvailablePosition,
    resolveStacking,
    constrainToViewport,
    moveItems
  };
}
