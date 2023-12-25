import {CarbonPlugin, Extension} from "../core";
import { ClipboardPlugin } from "./Clipboard";
import { KeyboardPlugin } from './Keyboard';
import { SelectionChangePlugin } from './SelectionChange';
import { SlicePlugin } from "./Slice";
import { TransformCommands } from './TransformCommands';
import { HistoryPlugin } from "./History";
import { FormatterPlugin } from "./Formatter";
import { ActionPlugin } from "./Action";

export const corePresetPlugins: CarbonPlugin[] = [
  new SelectionChangePlugin(),
  new TransformCommands(),
  new KeyboardPlugin(),
  new ClipboardPlugin(),
  new SlicePlugin(),
  new HistoryPlugin(),
  new FormatterPlugin(),
  new ActionPlugin(),
];

export * from './TransformCommands'
