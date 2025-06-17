/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ...
  },
  plugins: [react(), nodePolyfills()],
});
