import { ReactRenderer } from "@emrgen/carbon-react";
import { ImageComp } from "./components/plugins/Image";

export * from "./components/FloatingStyleMenu";
export * from "./components/DocumentSaveStatus";
export * from "./components/ToggleViewMode";
export * from "./components/InsertBlockMenu";

export const carbonChakraRenderers = [ReactRenderer.create("image", ImageComp)];
