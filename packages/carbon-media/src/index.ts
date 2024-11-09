import { ReactRenderer } from "@emrgen/carbon-react";
import ImageComp from "./component/Image";
import { VideoComp } from "./component/Video";
import { Image } from "./plugin/Image";
import { Video } from "./plugin/Video";

export const mediaPlugins = [new Image(), new Video()];

export const mediaRenderers = [
  ReactRenderer.create("image", ImageComp),
  ReactRenderer.create("video", VideoComp),
];