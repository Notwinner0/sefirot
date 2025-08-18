import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue()
  ],
  css: {
    devSourcemap: true,
  },
  // server: {
  //   proxy: {
  //     "/theia": {
  //       target: "http://localhost:3000", // Theia backend
  //       changeOrigin: true,
  //       ws: true
  //     }
  //   }
  // }
});
