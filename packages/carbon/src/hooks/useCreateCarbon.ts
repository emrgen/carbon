import { flatten } from 'lodash';
import { useState } from "react";
import { Actor } from '../core/Actor';
import { Extension } from "../core/Extension";
import { PluginManager } from '../core/PluginManager';
import { CarbonRenderer, Renderer } from "../core/Renderer";
import { Schema } from '../core/Schema';
import { SchemaFactory } from '../core/SchemaFactory';
import { NodeJSON } from "../core/types";
import { CarbonDefaultNode } from "../renderer";
import { Carbon } from '../core/Carbon';


export const createCarbon = (actor: Actor, json: NodeJSON, extensions: Extension[] = []) => {
	const plugins = flatten(extensions.map(e => e.plugins));
	const renderers: Renderer[] = flatten(extensions.map(e => e.renderers ?? []));
	const renderer = CarbonRenderer.create(renderers, CarbonDefaultNode)

	const pm = new PluginManager(plugins);
	const {specs} = pm;
	const schema = new Schema(specs, new SchemaFactory(actor));

	const content = schema.nodeFromJSON(json);
	console.log(json)
	if (!content) {
		throw new Error("Failed to parse app content");
	}

	return new Carbon(content, schema, pm, renderer)
}


export const useCreateCarbon = (actor: Actor, json: NodeJSON, extensions: Extension[] = []) => {
	const [app] = useState(() => {
		return createCarbon(actor, json, extensions)
	})

	return app;
}
