import { ReactRenderer } from "@emrgen/carbon-react";
import { Timeline } from "./plugin/Timeline";
import { TimelineComp } from "./renderer/Timeline";
import "./timeline.styl";

export const timelineRenderer = [
  ReactRenderer.create("timeline", TimelineComp),
];

export const timelinePlugin = [new Timeline()];