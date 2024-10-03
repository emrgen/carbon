import { cloneDeep, merge } from "lodash";
import { Optional } from "@emrgen/types";
import { CarbonPlugin } from "./CarbonPlugin";

export class PluginStates {
  states: Map<string, PluginState> = new Map();
  common: Map<string, any> = new Map();

  register(plugin: CarbonPlugin) {
    if (this.states.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    const state = new PluginState(this.states);
    this.states.set(plugin.name, state);
    return state;
  }
}

export class PluginState {
  store: Record<string, any> = {};

  constructor(private readonly states: Map<string, PluginState> = new Map()) {}

  plugin(name: string): Optional<ReadPluginState> {
    const state = this.states.get(name);
    if (!state) {
      return null;
    }
    return new ReadPluginState(state);
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

export class ReadPluginState {
  constructor(private readonly state: PluginState) {}

  get(key: string) {
    return this.state.get(key);
  }
}
