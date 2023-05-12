import { flatten } from 'lodash';
import { useState } from "react";
import { Extension } from "../core/Extension";
import { PluginManager } from '../core/PluginManager';
import { RenderManager, Renderer } from "../core/Renderer";
import { Schema } from '../core/Schema';
import { SchemaFactory } from '../core/SchemaFactory';
import { NodeJSON } from "../core/types";
import { CarbonDefaultNode } from "../renderer";
import { Carbon } from '../core/Carbon';


export const createCarbon = (json: NodeJSON, extensions: Extension[] = []) => {
	const plugins = flatten(extensions.map(e => e.plugins));
	const renderers: Renderer[] = flatten(extensions.map(e => e.renderers ?? []));
	const renderer = RenderManager.create(renderers, CarbonDefaultNode)

	const pm = new PluginManager(plugins);
	const {specs} = pm;
	const schema = new Schema(specs, new SchemaFactory());

	const content = schema.nodeFromJSON(json);
	if (!content) {
		throw new Error("Failed to parse app content");
	}

	return new Carbon(content, schema, pm, renderer)
}


export const useCreateCarbon = (json: NodeJSON, extensions: Extension[] = []) => {
	const [app] = useState(() => {
		return createCarbon(json, extensions)
	})

	return app;
}
