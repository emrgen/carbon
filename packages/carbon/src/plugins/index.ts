import { Extension } from '../core/Extension';
import { SelectionPlugin } from './Selection';

export const extensionPresets: Extension = {
	plugins: [
		new SelectionPlugin()
	],
}
