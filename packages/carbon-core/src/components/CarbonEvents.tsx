import React from 'react'
import { EventsIn } from '../core';
import { useEventListeners, useSelectionChange } from '../hooks';

// listen for dom event
const events: EventsIn[] = [
  EventsIn.beforeinput,
  EventsIn.input,
  EventsIn.keyUp,
  EventsIn.keyDown,
  EventsIn.click,
  EventsIn.mouseDown,
  EventsIn.mouseDown,
  EventsIn.mouseOver,
  EventsIn.mouseOut,
  EventsIn.mouseUp,
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
    <div className='carbon-app-events' {...listeners}>
      {props.children}
    </div>
  )
}
