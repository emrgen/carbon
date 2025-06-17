import {blockPresetPlugins} from "@emrgen/carbon-blocks";
import {
  CarbonEditor,
  CarbonPlugin,
  corePresetPlugins,
  Node,
  NodeId,
  Pin,
  PinnedSelection,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import {ImmutableNodeFactory, ImmutableState} from "@emrgen/carbon-react";

let counter = 0;
class CustomFactory extends ImmutableNodeFactory {
  blockId() {
    return NodeId.fromString(`[${counter++}]`);
  }

  textId() {
    return NodeId.fromString(`[${counter++}]`);
  }
}

export const createCarbon = (json: any, extraPlugins: CarbonPlugin[] = []) => {
  counter = 0;
  const plugins = [
    ...corePresetPlugins,
    ...blockPresetPlugins,
    ...extraPlugins,
  ];

  const pm = new PluginManager(plugins);
  const scope = Symbol("test");

  const specs = pm.specs;
  const schema = new Schema(specs, new CustomFactory(scope, () => ""));

  const root = schema.nodeFromJSON(json)!;
  const state = ImmutableState.create(scope, root, PinnedSelection.IDENTITY);

  return new CarbonEditor(state, schema, pm);
};

export const nameOffset = (pos: { node: Node; offset: number }) => {
  return `${pos.node.name}:${pos.offset}`;
};

export const nameOffsetStep = (pin: Pin) => {
  return `${pin.node.name}:${pin.offset}:${pin.steps}`;
};
