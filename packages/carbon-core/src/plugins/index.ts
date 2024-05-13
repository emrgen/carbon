import { CarbonPlugin } from "../core";
import { ClipboardPlugin } from "../../../carbon-clipboard/src/plugin/Clipboard";
import { KeyboardPlugin } from "./Keyboard";
import { SelectionChangePlugin } from "./SelectionChange";
import { SlicePlugin } from "./Slice";
import { TransformCommands } from "./TransformCommands";
import { HistoryPlugin } from "./History";
import { FormatterPlugin } from "./Formatter";
import { ActionPlugin } from "./Action";
import { Runtime } from "./Runtime";

export const corePresetPlugins: CarbonPlugin[] = [
  new SelectionChangePlugin(),
  new TransformCommands(),
  new KeyboardPlugin(),
  new ClipboardPlugin(),
  new SlicePlugin(),
  new HistoryPlugin(),
  new FormatterPlugin(),
  new ActionPlugin(),
  new Runtime(),
];

export * from "./TransformCommands";
