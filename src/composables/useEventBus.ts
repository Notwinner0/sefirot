import { reactive } from 'vue';

type EventCallback = (...args: any[]) => void;

interface EventBus {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, ...args: any[]): void;
}

const eventCallbacks = reactive(new Map<string, Set<EventCallback>>());

export function useEventBus(): EventBus {
  const on = (event: string, callback: EventCallback) => {
    if (!eventCallbacks.has(event)) {
      eventCallbacks.set(event, new Set());
    }
    eventCallbacks.get(event)!.add(callback);
  };

  const off = (event: string, callback: EventCallback) => {
    if (eventCallbacks.has(event)) {
      eventCallbacks.get(event)!.delete(callback);
      if (eventCallbacks.get(event)!.size === 0) {
        eventCallbacks.delete(event);
      }
    }
  };

  const emit = (event: string, ...args: any[]) => {
    if (eventCallbacks.has(event)) {
      eventCallbacks.get(event)!.forEach(callback => {
        callback(...args);
      });
    }
  };

  return { on, off, emit };
}
