import { lazy } from "react";

export const LazyDev = lazy(() =>
  import("./Dev/Dev").then((module) => {
    return { default: module.Dev };
  }),
);

export const LazyDraggableDemo = lazy(() =>
  import("./Demo/Draggable").then((module) => {
    return { default: module.DraggableDemo };
  }),
);

export const LazyEmojiDemo = lazy(() =>
  import("./Demo/Emoji").then((module) => {
    return { default: module.EmojiDemo };
  }),
);

export const LazyDesign = lazy(() =>
  import("./Dev/Design").then((module) => {
    return { default: module.Design };
  }),
);

export const LazyBoard = lazy(() =>
  import("./Dev/Board").then((module) => {
    return { default: module.Board };
  }),
);