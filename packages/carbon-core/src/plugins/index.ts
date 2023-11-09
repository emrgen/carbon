import { Extension } from "../core";
import { ClipboardPlugin } from "./Clipboard";
import { KeyboardAfterPlugin, KeyboardBeforePlugin } from './Keyboard';
import { SelectionChangePlugin } from './SelectionChange';
import { SlicePlugin } from "./Slice";
import { TransformCommands } from './TransformCommands';
import { HistoryPlugin } from "./History";
import { TimeTravelPlugin } from "./TimeTravel";

export const extensionPresets: Extension = {
	plugins: [
		new SelectionChangePlugin(),
		new TransformCommands(),
		new KeyboardAfterPlugin(),
		new KeyboardBeforePlugin(),
		new ClipboardPlugin(),
		new SlicePlugin(),
		// new HistoryPlugin(),
		new TimeTravelPlugin(),
	],
}

export * from './TransformCommands'
