import './chakra.styl';

import { ReactRenderer } from "@emrgen/carbon-react";
import { ImageComp } from "./components/plugins/Image";
import { VideoComp } from "./components/plugins/Video";

export * from "./components/FloatingStyleMenu";
export * from "./components/DocumentSaveStatus";
export * from "./components/ToggleViewMode";
export * from "./components/InsertBlockMenu";

export const carbonChakraRenderers = [
  ReactRenderer.create("image", ImageComp),
  ReactRenderer.create("video", VideoComp)
];
