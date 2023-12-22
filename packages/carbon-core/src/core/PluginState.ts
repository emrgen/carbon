import { CarbonPlugin } from "@emrgen/carbon-core";
import { cloneDeep, merge } from "lodash";

export class PluginStates {
  states: Map<string, PluginState> = new Map();
  common: Map<string, any> = new Map();

  register(plugin: CarbonPlugin) {
    if (this.states.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    const state = new PluginState(this.common);
    this.states.set(plugin.name, state);
    return state;
  }
}

export class PluginState {
  store: Record<string, any> = {};
  common: Map<string, any> = new Map();

  constructor(props) {
    this.common = props;
  }


  get(key: string) {
    return this.store[key];
  }

  set(key: string, value: any) {
    this.store[key] = value;
  }

  merge(key: string, value: any) {
    this.store[key] = merge(this.store[key], value);
  }

  clone(key: string) {
    return cloneDeep(this.store[key]);
  }
}
