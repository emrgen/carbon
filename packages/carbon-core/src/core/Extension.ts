import { CarbonPlugin } from "./CarbonPlugin";
import { ReactRenderer } from "@emrgen/carbon-react";

// Extension acts as group of plugins and renderers
export interface Extension {
  plugins?: CarbonPlugin[];
  renderers?: ReactRenderer[];
}

export const mergeExtensions = (...extensions: Extension[]): Extension => {
  return extensions.reduce(
    (acc, ext) => {
      return {
        plugins: [...(acc.plugins ?? []), ...(ext.plugins ?? [])],
        renderers: [...(acc.renderers ?? []), ...(ext.renderers ?? [])],
      };
    },
    { plugins: [], renderers: [] },
  );
};
