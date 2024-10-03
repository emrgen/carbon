import {
  Carbon,
  corePresetPlugins,
  PinnedSelection,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { Node } from "@emrgen/carbon-core";
import { Pin } from "@emrgen/carbon-core";
import { blockPresetPlugins } from "@emrgen/carbon-blocks";
import { ImmutableNodeFactory, ImmutableState } from "@emrgen/carbon-react";

export const createCarbon = (json: any, extraPlugins: CarbonPlugin[] = []) => {
  const plugins = [
    ...corePresetPlugins,
    ...blockPresetPlugins,
    ...extraPlugins,
  ];

  const pm = new PluginManager(plugins);
  const scope = Symbol("test");

  const specs = pm.specs;
  const schema = new Schema(specs, new ImmutableNodeFactory(scope, () => ""));

  const root = schema.nodeFromJSON(json)!;
  const state = ImmutableState.create(scope, root, PinnedSelection.IDENTITY);

  return new Carbon(state, schema, pm);
};

export const nameOffset = (pos: { node: Node; offset: number }) => {
  return `${pos.node.name}:${pos.offset}`;
};

export const nameOffsetStep = (pin: Pin) => {
  return `${pin.node.name}:${pin.offset}:${pin.steps}`;
};
