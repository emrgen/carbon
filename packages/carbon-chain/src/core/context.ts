import {Optional} from "@emrgen/types";
import {Node, NodeId} from "@emrgen/carbon-core";

export interface Context<T> {
  id: Symbol;
  subscribe: (listener: (value: T) => void) => void;
  unsubscribe: (listener: (value: T) => void) => void;
  update: (value: T) => void;
  getValue: () => T;
}

export const createContext = <T>(defaultValue: T): Context<T> => {
  let value = defaultValue;
  const listeners = new Set<(value: T) => void>();

  const subscribe = (listener: (value: T) => void) => {
    listeners.add(listener);
  }

  const unsubscribe = (listener: (value: T) => void) => {
    listeners.delete(listener);
  }

  const update = (newValue: T) => {
    value = newValue;
    listeners.forEach(listener => listener(value));
  }

  const getValue = () => value;

  const context = {
    id: Symbol('context'),
    subscribe,
    unsubscribe,
    update,
    getValue,
    Provider: (props: { value: T, children: any }) => {
      update(props.value);
      return props.children;
    }
  }

  CONTEXTS.set(context.id, context);

  return context;
}

const CONTEXTS = new Map<Symbol, any>();

export const getContext = <T>(context: Context<T>): Context<T> => {
  const instance = CONTEXTS.get(context.id)
  if (!instance) {
    throw new Error('Context not found');
  }

  return instance
}
