import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
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
