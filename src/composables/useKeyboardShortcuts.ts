import { onMounted, onUnmounted } from 'vue';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true') {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrl === event.ctrlKey;
      const shiftMatches = !!shortcut.shift === event.shiftKey;
      const altMatches = !!shortcut.alt === event.altKey;

      return keyMatches && ctrlMatches && shiftMatches && altMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.handler();
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return {
    shortcuts
  };
}
