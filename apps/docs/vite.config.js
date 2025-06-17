import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig(function () {
    return {
        define: {
            "process.env": {},
        },
        plugins: [react()],
        esbuild: {
            supported: {
                "top-level-await": true,
            },
        },
    };
});
