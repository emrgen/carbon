import { EventsIn } from "../core/Event";
import { useCarbon } from '../hooks/useCarbon';
import { useEventListeners } from "../hooks/useEventHandlers";
import { useSelectionChange } from "../hooks/useSelectionChange";
import { CarbonNode } from '../renderer/CarbonNodes';
import CarbonPortal from "./CarbonPortal";

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
  EventsIn.scroll,
  EventsIn.blur,
  EventsIn.focus,
];

// all editor content is rendered inside this component
// events captured from this component is processed in Editor
export function CarbonContent() {
  const editor = useCarbon();

  useSelectionChange();
  const listeners = useEventListeners(events);

  return (
    <>
      <div className="carbon-content" {...listeners}>
        <CarbonNode node={editor.content} />
      </div>

      {/* helper portal for the app */}
      <CarbonPortal/>
    </>
  );
}
