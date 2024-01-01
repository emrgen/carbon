import {createContext, onCleanup} from "solid-js";
import {Carbon, EventsIn} from "@emrgen/carbon-core";
import {useMemo} from "react";
import {camelCase} from "lodash";
import {useCarbon} from "../hooks";

const defaultEvents: EventsIn[] = [
  EventsIn.beforeinput,
  EventsIn.input,
  EventsIn.keyUp,
  EventsIn.keyDown,
  EventsIn.click,
  EventsIn.mouseDown,
  EventsIn.mouseOver,
  EventsIn.mouseOut,
  EventsIn.mouseUp,
  EventsIn.scroll,
  EventsIn.blur,
  EventsIn.focus,
  EventsIn.paste,
];

// prevent default for some events
const preventDefaultEvents = {
  [EventsIn.keyDown]: (e) => {
    if (e.key === 'Enter') {
      return true;
    }

    if (e.key === 'Backspace') {
      return true;
    }

    if (e.key === 'Delete') {
      return true;
    }

    if (e.key === 'input') {
      return true;
    }

    if (e.key === 'beforeInput') {
      return true;
    }

    return false;
  },
};

const eventWrapper = (event) => {
  return {
    nativeEvent: event,
    stopPropagation: () => {
      event.stopPropagation();
    },
    preventDefault: () => {
      event.preventDefault();
    }
  }
}

const handlers = (app: Carbon) => {
  return defaultEvents.reduce(
    (o, eventType) => ({
      ...o,
      [(`on${eventType}`).toLowerCase()]: (event: Event) => {
        // console.log('xxx', eventType, event);
        if (preventDefaultEvents[eventType]?.(event)) {
          event.preventDefault();
        }
        // console.log('fired event', eventType, event)

        app.onEvent(eventType, eventWrapper(event));
      },
    }),
    {}
  );
}

export const CarbonEvents = (props) => {
  const app = useCarbon();

  const onSelectionChange = (event: Event) => {
    console.log('selection change', event);
    app.onEvent(EventsIn.selectionchange, event);
  }

  const onSelectionStart = (event: Event) => {
    app.onEvent(EventsIn.selectstart, event)
  }

  document.addEventListener(EventsIn.selectionchange, onSelectionChange);
  document.addEventListener(EventsIn.selectstart, onSelectionStart);
  onCleanup(() => {
    document.removeEventListener(EventsIn.selectionchange, onSelectionChange);
    document.removeEventListener(EventsIn.selectstart, onSelectionStart);
  })

  return (
    <div class={'carbon-app-events'} {...handlers(app)}>
      {props.children}
    </div>
  )
}
