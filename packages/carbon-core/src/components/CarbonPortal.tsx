import React, { useEffect, useState } from "react";
import { useCarbon } from "../hooks";
import { Optional } from "@emrgen/types";
import { Node } from "../core";

export default function CarbonPortal() {
  const app = useCarbon();
  const [showMenu, setShowMenu] = useState(false);
  const [activeNode, setActiveNode] = useState<Optional<Node>>(null);

  useEffect(() => {
    const showMenu = (nodeId, clickRect) => {
      const node = app.store.get(nodeId);
      if (!node) return;
      setActiveNode(node);
      setShowMenu(true);

      console.log("xxx", nodeId, clickRect);
    };

    app.on("show:options:menu", showMenu);
    return () => {
      app.off("show:options:menu", showMenu);
    };
  }, [app]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
  };

  return (
    <>
      {showMenu && (
        <div
          onClick={handleClick}
          className={"carbon-portal"}
          contentEditable="false"
          suppressContentEditableWarning
        ></div>
      )}
    </>
  );
}
