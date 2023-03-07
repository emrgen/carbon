import { Extension } from '../core/Extension';
import { KeyboardPlugin } from './Keyboard';
import { SelectionChangePlugin } from './SelectionChange';

export const extensionPresets: Extension = {
	plugins: [
		new SelectionChangePlugin(),
		new KeyboardPlugin(),
	],
}
