import { CarbonPlugin } from "../core";
import { KeyboardPlugin } from "./Keyboard";
import { SelectionChangePlugin } from "./SelectionChange";
import { SlicePlugin } from "./Slice";
import { TransformCommands } from "./TransformCommands";
import { HistoryPlugin } from "./History";
import { FormatterPlugin } from "./Formatter";
import { ActionPlugin } from "./Action";
import { Runtime } from "./Runtime";
import { MarkPlugin } from "./Mark";

export const corePresetPlugins: CarbonPlugin[] = [
  new SelectionChangePlugin(),
  new TransformCommands(),
  new KeyboardPlugin(),
  new SlicePlugin(),
  new HistoryPlugin(),
  new FormatterPlugin(),
  new ActionPlugin(),
  new Runtime(),
  new MarkPlugin(),
];

export * from "./TransformCommands";
