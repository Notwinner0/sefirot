import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
// import "./demo/demo"; // Import the demo.ts file

// POST screen logic
async function performPost() {
  // Hardware checks
  const hardwareInfo = {
    cpu: navigator.hardwareConcurrency || 'Unknown',
    ram: ((window as any).performance && (window as any).performance.memory) ? `${Math.round((window as any).performance.memory.usedJSHeapSize / 1024 / 1024)}MB used` : 'Unknown',
    graphics: (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return gl ? 'WebGL Available' : 'WebGL Not Available';
      } catch {
        return 'Graphics Check Failed';
      }
    })(),
    display: `${window.screen.width}x${window.screen.height}`,
    peripherals: navigator.mediaDevices ? 'Media devices available' : 'No media devices'
  };

  console.log('Hardware checks completed:', hardwareInfo);

  // Fetch plain text from backend
  try {
    const response = await window.fetch('http://localhost:3000/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const text = await response.text();
      // Show POST response temporarily
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: monospace; font-size: 24px;">${text}</div>`;

      // 1 ms delay
      await new Promise(resolve => setTimeout(resolve, 10));
      document.body.innerHTML = originalContent;

      return true; // POST completed successfully
    } else {
      // Server responded with error status
      console.error('POST failed with status:', response.status);
    }
  } catch (error) {
    console.error('POST failed:', error);
  }

  // POST failed - show FAILED screen
  document.body.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: monospace; font-size: 24px; color: red;">FAILED</div>`;
  return false; // POST failed, don't load Vue
}

// Run POST before mounting Vue
performPost().then((postCompleted) => {
  if (postCompleted) {
    // POST succeeded, load the desktop UI
    const app = createApp(App);
    app.use(createPinia());
    app.mount("#app");
  }
  // If POST failed, stay on the FAILED screen (don't load Vue)
});
