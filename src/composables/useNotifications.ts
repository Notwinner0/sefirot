import { ref, computed } from 'vue';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  timestamp: Date;
}

export function useNotifications() {
  const notifications = ref<Notification[]>([]);
  const nextId = ref(1);

  const addNotification = (
    type: Notification['type'],
    title: string,
    message: string,
    duration = 5000
  ) => {
    const notification: Notification = {
      id: `notification-${nextId.value++}`,
      type,
      title,
      message,
      duration,
      timestamp: new Date()
    };

    notifications.value.push(notification);

    // Auto-remove after duration if not persistent
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    }

    return notification.id;
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAllNotifications = () => {
    notifications.value = [];
  };

  const success = (title: string, message: string, duration?: number) =>
    addNotification('success', title, message, duration);

  const error = (title: string, message: string, duration?: number) =>
    addNotification('error', title, message, duration);

  const warning = (title: string, message: string, duration?: number) =>
    addNotification('warning', title, message, duration);

  const info = (title: string, message: string, duration?: number) =>
    addNotification('info', title, message, duration);

  return {
    notifications: computed(() => notifications.value),
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  };
}
