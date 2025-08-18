import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
// import "./demo/demo"; // Import the demo.ts file

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
