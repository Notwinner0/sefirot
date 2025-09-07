<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'p-4 rounded-lg shadow-lg border-l-4 text-white max-w-sm',
          getNotificationClasses(notification.type)
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 class="font-semibold text-sm">{{ notification.title }}</h4>
            <p class="text-sm opacity-90 mt-1">{{ notification.message }}</p>
          </div>
          <button
            @click="removeNotification(notification.id)"
            class="ml-2 text-white opacity-70 hover:opacity-100 text-lg leading-none"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications';

const { notifications, removeNotification } = useNotifications();

const getNotificationClasses = (type: string) => {
  const baseClasses = 'bg-opacity-95 backdrop-blur-sm';

  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-500 border-green-600`;
    case 'error':
      return `${baseClasses} bg-red-500 border-red-600`;
    case 'warning':
      return `${baseClasses} bg-yellow-500 border-yellow-600`;
    case 'info':
    default:
      return `${baseClasses} bg-blue-500 border-blue-600`;
  }
};
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
