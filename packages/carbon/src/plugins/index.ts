import { Extension } from '../core/Extension';
import { KeyboardPlugin } from './Keyboard';
import { SelectionChangePlugin } from './SelectionChange';
import { TransformCommands } from './TransformCommands';

export const extensionPresets: Extension = {
	plugins: [
		new SelectionChangePlugin(),
		new TransformCommands(),
		new KeyboardPlugin(),
	],
}
