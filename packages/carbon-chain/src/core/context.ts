import {last} from "lodash";
import {v4 as uuidv4} from 'uuid';

export interface Context<T> {
  id: Symbol;
  update: (value: T) => void;
  value: () => T;
  Provider: (props: { value: T, children?: any }) => any;
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

  const id = Symbol("context");

  // console.log('createContext', id)

  const context = {
    id,
    update,
    value: getValue,
    Provider: (props: { value: T, children?: any }) => {
      CONTEXTS.set(id, [context]);
      update(props.value);
      return props.children;
    }
  }

  return context;
}

const CONTEXTS = new Map<Symbol, any>();

export const getContext = <T>(context: Context<T>): T => {
  // console.log('getContext', context, Array.from(CONTEXTS.keys()).map(key => key === context.id));
  const instance = last(CONTEXTS.get(context.id)) as Context<T>;

  if (!instance) {
    throw new Error('Context not found');
  }

  return instance.value();
}
