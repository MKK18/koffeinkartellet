import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // host:true listens on all interfaces so http://localhost AND http://127.0.0.1
  // both work (and you can open the Network URL on your phone to see the UI).
  server: { port: 5173, host: true },
});
