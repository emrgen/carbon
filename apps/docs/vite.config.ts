import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";
import {nodePolyfills} from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    define: {
      "process.env": {},
    },
    plugins: [react(), nodePolyfills()],
    // experimental: {
    //   // prefix /carbon/ to all urls
    //   renderBuiltUrl(filename, {hostId, hostType, type}) {
    //     return {runtime: `/carbon/${filename}`};
    //   },
    // },
    esbuild: {
      supported: {
        "top-level-await": true,
      },
    },
  };
});
