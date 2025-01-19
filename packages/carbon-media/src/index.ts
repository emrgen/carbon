import { ReactRenderer } from "@emrgen/carbon-react";
import ImageComp from "./component/Image";
import { VideoComp } from "./component/Video";
import { Image } from "./plugin/Image";
import {Media} from "./plugin/Media";
import { Video } from "./plugin/Video";

export const mediaPlugins = [new Image(), new Video(), new Media()];

export const mediaRenderers = [
  ReactRenderer.create("image", ImageComp),
  ReactRenderer.create("video", VideoComp),
];

export * from "./plugin/Image";
export * from "./plugin/Video";
export * from "./plugin/Media";