import { pluginStylus } from "@rsbuild/plugin-stylus";
import { pluginReact } from "@rsbuild/plugin-react";
import { loadEnv } from "@rsbuild/core";

const { publicVars } = loadEnv({ prefixes: ["VITE_"] });

export default {
  plugins: [pluginStylus(), pluginReact()],
  html: {
    template: "./index.html",
  },
  source: {
    entry: {
      index: "./src/main.tsx",
    },
    define: publicVars,
  },
};
