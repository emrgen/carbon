import { CarbonPlugin } from "../core";
import { KeyboardPlugin } from "./Keyboard";
import { SelectionChangePlugin } from "./SelectionChange";
import { SliceNode } from "./Slice";
import { TransformCommands } from "./TransformCommands";
import { HistoryPlugin } from "./History";
import { FormatterPlugin } from "./Formatter";
import { ActionPlugin } from "./Action";
import { Runtime } from "./Runtime";
import { MarkPlugin } from "./Mark";
import { EmptyInline } from "./EmptyInline";

export const corePresetPlugins: CarbonPlugin[] = [
  new SelectionChangePlugin(),
  new TransformCommands(),
  new KeyboardPlugin(),
  new SliceNode(),
  new HistoryPlugin(),
  new FormatterPlugin(),
  new ActionPlugin(),
  new Runtime(),
  new MarkPlugin(),
  new EmptyInline(),
];

export * from "./TransformCommands";

export * from "./Slice";
export * from "./InlineAtom";
export * from "./EmptyInline";
