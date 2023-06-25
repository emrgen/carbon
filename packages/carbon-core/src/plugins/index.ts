import { Extension } from "../core";
import { ClipboardPlugin } from "./Clipboard";
import { KeyboardAfterPlugin, KeyboardBeforePlugin } from './Keyboard';
import { SelectionChangePlugin } from './SelectionChange';
import { TransformCommands } from './TransformCommands';

export const extensionPresets: Extension = {
	plugins: [
		new SelectionChangePlugin(),
		new TransformCommands(),
		new KeyboardAfterPlugin(),
		new KeyboardBeforePlugin(),
		new ClipboardPlugin()
	],
}

export * from './TransformCommands'
