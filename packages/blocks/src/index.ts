export * from './create'
import { CarbonText, Extension, Renderer, CarbonBlock, CarbonNode } from '@emrgen/carbon-core';
import { NestableComp } from './renderers/Nestable';
import { Section } from './plugins/Section';
import { DocumentComp } from './renderers/Document';
import { DocPlugin } from './plugins/Document';
import { Header } from './plugins/Header';

import './style.styl';

export const blockPresets: Extension = {
	plugins: [
		new Section(),
		new Header(),
		new DocPlugin(),
		new DocPlugin(),
	],
	renderers: [
		Renderer.create('document', DocumentComp),
		Renderer.create('text', CarbonText),
		Renderer.create('title', CarbonNode),
		Renderer.create('section', NestableComp),
		Renderer.create('h1', NestableComp),
		Renderer.create('h2', NestableComp),
		Renderer.create('h3', NestableComp),
		Renderer.create('h4', NestableComp),
	]
}
