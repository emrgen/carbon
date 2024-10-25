import { ReactRenderer } from "@emrgen/carbon-react";
import { FlashCard } from "./plugins/FlashCard";
import { FlashComp } from "./renderers/Flash";
import "./flash.styl";
import { FlashAnswerComp } from "./renderers/FlashAnswer";
import { FlashViewComp } from "./renderers/FlashView";

export const flashRenderers = [
  ReactRenderer.create("flashCard", FlashComp),
  ReactRenderer.create("flashView", FlashViewComp),
  ReactRenderer.create("flashAnswer", FlashAnswerComp),
];

export const flashPlugin = new FlashCard();
