import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: { entry: resolve(__dirname, "src/index.ts"), formats: ["es"] },
    },
    resolve: { alias: { src: resolve("src/") } },
  };
});