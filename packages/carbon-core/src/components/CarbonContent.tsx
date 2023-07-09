import { EventsIn } from "../core/Event";
import { useCarbonChange } from "../hooks";
import { useCarbon } from '../hooks/useCarbon';
import { useEventListeners } from "../hooks/useEventHandlers";
import { useSelectionChange } from "../hooks/useSelectionChange";
import { CarbonNode } from '../renderer/CarbonNodes';
import CarbonPortal from "./CarbonPortal";
import { useEffect, useRef } from 'react';

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

// all editor content is rendered inside this component
// events captured from this component is processed in Editor
export function CarbonContent() {
  const app = useCarbon();
  const change = useCarbonChange();
  const parkCursorRef = useRef<HTMLInputElement>(null);

  useSelectionChange();
  const listeners = useEventListeners(events);

  return (
    <>
      <div className="carbon-content" {...listeners}>
        <CarbonNode node={app.content} />
      </div>
      {/* helper portal for the app */}
      {/* <CarbonPortal/> */}
    </>
  );
}
