import {
  Carbon,
  corePresetPlugins,
  PinnedSelection,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import { blockPresetPlugins } from "@emrgen/carbon-blocks";
import { ImmutableNodeFactory, ImmutableState } from "@emrgen/carbon-react";

export const createCarbon = (json: any) => {
  const plugins = [...corePresetPlugins, ...blockPresetPlugins];

  const pm = new PluginManager(plugins);
  const scope = Symbol("test");

  const specs = pm.specs;
  const schema = new Schema(specs, new ImmutableNodeFactory(scope, () => ""));

  const root = schema.nodeFromJSON(json)!;
  const state = ImmutableState.create(scope, root, PinnedSelection.IDENTITY);

  return new Carbon(state, schema, pm);
};
