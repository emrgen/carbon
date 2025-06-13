import { KeyboardEvent } from "react";
import { EventContext } from "../core";

// export const stop(fn: Function)

interface EventPreventable {
  preventDefault(): void;
  nativeEvent?: {
    preventDefault(): void;
  };
}

interface EventStoppable {
  stopPropagation(): void;
}

export function stop<T extends EventStoppable>(event: T): void;
export function stop<T extends EventStoppable>(fn: Function): (event: T) => void;

// This function is used to stop the propagation of an event or call a function
export function stop<T extends EventStoppable>(
  eventOrFn: T | Function,
): ((event: T) => void) | void {
  if (typeof eventOrFn === "function") {
    return (e) => {
      e.stopPropagation();
      eventOrFn();
    };
  } else {
    eventOrFn.stopPropagation();
  }
}

export function prevent<T extends EventPreventable>(event: T): void;
export function prevent<T extends EventPreventable>(fn: Function): (event: T) => void;

// This function is used to prevent default behavior of an event or call a function
export function prevent<T extends EventPreventable>(
  eventOrFn: T | Function,
): ((event: T) => void) | void {
  if (typeof eventOrFn === "function") {
    return (e) => {
      e.preventDefault();
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
      }
      eventOrFn();
    };
  } else {
    eventOrFn.preventDefault();
  }
}

// This function is used to prevent default and stop propagation of an event
export function preventAndStop<T extends EventPreventable & EventStoppable>(event: T) {
  event.preventDefault();
  event.stopPropagation();
}

// This function is used to prevent default and stop propagation of an event in a context
export const preventAndStopCtx = (ctx: EventContext<any>) => {
  stop(ctx.event);
  prevent(ctx.event);
  ctx.stopPropagation();
};

// This function is used to call a function when the Enter key is pressed
export const onEnter = (fn: Function) => (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    fn(e);
  }
};
