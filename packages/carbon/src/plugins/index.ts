import { Extension } from '../core/Extension';
import { KeyboardPlugin } from './Keyboard';
import { SelectionPlugin } from './Selection';

export const extensionPresets: Extension = {
	plugins: [
		new SelectionPlugin(),
		new KeyboardPlugin(),
	],
}
