import React, { useEffect, useRef, useState } from "react";
import { useCarbon } from "../hooks";
import { Optional } from "@emrgen/types";
import { Node } from "../core";
import { BlockEvent } from "@emrgen/carbon-blocks";

export function CarbonPortal(props) {
  const app = useCarbon();
  const ref = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeNode, setActiveNode] = useState<Optional<Node>>(null);

  // useEffect(() => {
  //   const showMenu = (nodeId, clickRect) => {
  //     const node = app.store.get(nodeId);
  //     if (!node) return;
  //     setActiveNode(node);
  //     setShowMenu(true);

  //     console.log("xxx", nodeId, clickRect);
  //   };

  //   app.on("show:options:menu", showMenu);
  //   return () => {
  //     app.off("show:options:menu", showMenu);
  //   };
  // }, [app]);

  // const handleClick = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setShowMenu(false);
  // };

  // useEffect(() => {
  //   app.focus();
  //   const onCreateDocument = (event) => {
  //     console.log('Event', event);
  //   }

  //   const onOpenDocument = (event) => {
  //     console.log("Open", event);
  //   };
  //   app.on(BlockEvent.openDocumentOverlay, onCreateDocument)
  //   app.on(BlockEvent.openDocument, onOpenDocument);
  //   return () => {
  //     app.off(BlockEvent.openDocumentOverlay, onCreateDocument)
  //     app.off(BlockEvent.openDocument, onOpenDocument);
  //   }
  // }, [app]);

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
