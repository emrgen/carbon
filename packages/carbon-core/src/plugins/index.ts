import { Extension } from "../core";
import { ClipboardPlugin } from "./Clipboard";
import { KeyboardAfterPlugin, KeyboardBeforePlugin } from './Keyboard';
import { SelectionChangePlugin } from './SelectionChange';
import { SlicePlugin } from "./Slice";
import { TransformCommands } from './TransformCommands';

export const extensionPresets: Extension = {
	plugins: [
		new SelectionChangePlugin(),
		new TransformCommands(),
		new KeyboardAfterPlugin(),
		new KeyboardBeforePlugin(),
		new ClipboardPlugin(),
		new SlicePlugin(),
	],
}

export * from './TransformCommands'
