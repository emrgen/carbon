import { CarbonPlugin } from "./CarbonPlugin";
import { Renderer } from "./Renderer";
import { merge } from 'lodash';

// Extension acts as group of plugins and renderers
export interface Extension {
	plugins?: CarbonPlugin[];
	renderers?: Renderer[];
}

export const mergeExtensions = (...extensions: Extension[]): Extension => {
	return extensions.reduce((acc, ext) => {
		return {
			plugins: [
				...acc.plugins ?? [],
				...ext.plugins ?? []
			],
			renderers: [
				...acc.renderers ?? [],
				...ext.renderers ?? []
			]
		}
	}, { plugins: [], renderers: [] });
}
