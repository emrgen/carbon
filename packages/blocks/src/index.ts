export * from './create'
import { CarbonText, Extension, Renderer, CarbonBlock, CarbonNode } from '@emrgen/carbon-core';
import { NestableComp } from './renderers/Nestable';
import { Section } from './plugins/Section';
import { DocumentComp } from './renderers/Document';
import { DocPlugin } from './plugins/Document';

import './style.styl'

export const blockPresets: Extension = {
	plugins: [
		new Section(),
		new DocPlugin(),
	],
	renderers: [
		Renderer.create('document', DocumentComp),
		Renderer.create('text', CarbonText),
		Renderer.create('title', CarbonNode),
		Renderer.create('section', NestableComp),
	]
}
