import React, { useEffect, useRef, useState } from "react";
import { useCarbon } from "../hooks";
import { Optional } from "@emrgen/types";
import { BlockEvent } from "@emrgen/carbon-blocks";

export function CarbonPortal(props) {
  const app = useCarbon();
  const ref = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeNode, setActiveNode] = useState<Optional<Node>>(null);

  // useEffect(() => {
  //   const showMenu = (nodeId, clickRect) => {
  //     const node = react.store.get(nodeId);
  //     if (!node) return;
  //     setActiveNode(node);
  //     setShowMenu(true);

  //     console.log("xxx", nodeId, clickRect);
  //   };

  //   react.on("show:options:menu", showMenu);
  //   return () => {
  //     react.off("show:options:menu", showMenu);
  //   };
  // }, [react]);

  // const handleClick = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setShowMenu(false);
  // };

  // useEffect(() => {
  //   react.focus();
  //   const onCreateDocument = (event) => {
  //     console.log('Event', event);
  //   }

  //   const onOpenDocument = (event) => {
  //     console.log("Open", event);
  //   };
  //   react.on(BlockEvent.openDocumentOverlay, onCreateDocument)
  //   react.on(BlockEvent.openDocument, onOpenDocument);
  //   return () => {
  //     react.off(BlockEvent.openDocumentOverlay, onCreateDocument)
  //     react.off(BlockEvent.openDocument, onOpenDocument);
  //   }
  // }, [react]);

  return (
    <>
      {props.children}
      <div
        className="carbon-overlay"
        ref={ref}
      />
    </>
  );
}
