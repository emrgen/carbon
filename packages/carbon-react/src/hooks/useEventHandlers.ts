import { camelCase } from "lodash";
import { useEffect, useMemo } from "react";
import { useCarbon } from "./useCarbon";
import { EventsIn, StateScope } from "@emrgen/carbon-core";

// listen for dom event
const defaultEvents: EventsIn[] = [
  EventsIn.beforeinput,
  EventsIn.input,
  EventsIn.keyUp,
  EventsIn.keyDown,
  EventsIn.click,
  EventsIn.mouseDown,
  // EventsIn.mouseOver,
  EventsIn.mouseEnter,
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
    if (e.key === "Enter") {
      return true;
    }

    if (e.key === "Backspace") {
      return true;
    }

    if (e.key === "Delete") {
      return true;
    }

    if (e.key === "input") {
      return true;
    }

    if (e.key === "beforeInput") {
      return true;
    }

    return false;
  },
};

export const useEventListeners = (events: EventsIn[] = defaultEvents) => {
  const app = useCarbon();
  const { scope } = app.state;

  const handlers = useMemo(() => {
    return events.reduce(
      (o, eventType) => ({
        ...o,
        [camelCase(`on-${eventType}`)]: (event: Event) => {
          // console.log('xxx', eventType, event);
          StateScope.set(scope);
          if (preventDefaultEvents[eventType]?.(event)) {
            event.preventDefault();
          }

          app.onEvent(eventType, event);
        },
      }),
      {},
    );
  }, [app, events, scope]);

  useEffect(() => {
    const onWindowResize = () => {
      app.emit("document:resize");
      app.emit("react:resize");
    };

    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, [app]);

  return handlers;
};
