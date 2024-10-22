import React from "react";
import { useEventListeners, useSelectionChange } from "../hooks";
import { EventsIn } from "@emrgen/carbon-core";

// listen for dom event
const events: EventsIn[] = [
  EventsIn.beforeinput,
  EventsIn.input,
  EventsIn.keyUp,
  EventsIn.keyDown,
  EventsIn.click,
  EventsIn.mouseDown,
  EventsIn.mouseEnter,
  // EventsIn.mouseOver,
  // EventsIn.mouseMove,
  // EventsIn.mouseOut,
  // EventsIn.mouseUp,
  EventsIn.dragStart,
  EventsIn.scroll,
  EventsIn.blur,
  EventsIn.focus,
  EventsIn.copy,
  EventsIn.cut,
  EventsIn.paste,
];

export function CarbonEvents(props) {
  useSelectionChange();
  const listeners = useEventListeners(events);

  return (
    <div className="carbon-app-events" {...listeners}>
      {props.children}
    </div>
  );
}
