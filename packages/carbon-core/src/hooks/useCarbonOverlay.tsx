import { RefObject, createContext, useContext, useRef, useState } from "react";
import { preventAndStop } from "../utils/event";
import EventEmitter from "events";
import { Node } from "../core";
import { Optional } from '@emrgen/types';

const InnerCarbonOverlayContext = createContext<{
  ref: RefObject<HTMLDivElement>;
  node: Optional<Node>;
  setNode(node: Optional<Node>)
  overlay: EventEmitter;
  showOverlay(id?: string);
  hideOverlay();
}>({} as any);

export const CarbonOverlayContext = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [emitter] = useState(() => new EventEmitter());
  const [id, setId] = useState('');
  const [node, setNode] = useState<Optional<Node>>(null);

  return (
    <InnerCarbonOverlayContext.Provider
      value={{
        ref,
        node,
        setNode,
        overlay: emitter,
        showOverlay: (id?: string) => {
          setId(id ?? "");
          setShowOverlay(true);
        },
        hideOverlay: () => {
          setId("");
          setShowOverlay(false);
        },
      }}
    >
      <div
        className="carbon-overlay"
        data-target={node?.name ?? ''}
        data-id={id}
        ref={ref}
        style={{
          opacity: showOverlay ? 1 : 0,
          zIndex: showOverlay ? 100 : -100,
        }}
        // onMouseDown={preventAndStop}
        onClick={(e) => {
          preventAndStop(e);
          setShowOverlay(false);
          emitter.emit("click", e);
        }}
      ></div>
      {children}
    </InnerCarbonOverlayContext.Provider>
  );
};

export const useCarbonOverlay = () => {
  return useContext(InnerCarbonOverlayContext);
};
