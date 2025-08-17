import { defineStore } from "pinia";

type WindowContent =
  | { type: "iframe"; src: string }
  | { type: "component"; name: string };

export const useWindowsStore = defineStore("windows", {
  state: () => ({
    windows: [] as { id: string; title: string; content: WindowContent }[]
  }),
  actions: {
    openApp(title: string, content: WindowContent) {
      this.windows.push({
        id: Date.now().toString(),
        title,
        content
      });
    },
    closeApp(id: string) {
      this.windows = this.windows.filter(w => w.id !== id);
    }
  }
});
