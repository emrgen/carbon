import { Node, useCarbon } from "@emrgen/carbon-core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BlockMenuCmd } from "../types";
import { activeBlockMenuTarget, activeBlockMenuTargetText } from "../atoms";
import { useRecoilState } from "recoil";

const BlockNameRegex = /^\/(.*)$/;

export function BlockMenu() {
  const app = useCarbon();
  const [target, setTarget] = useRecoilState(activeBlockMenuTarget);
  const [targetText, setTargetText] = useRecoilState(activeBlockMenuTargetText);
  // const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const onShowMenu = (node: Node) => {
      const el = app.store.element(node.id);
      if (!el) {
        console.error("no element found for node", node);
        return;
      }

      setTarget(node.id.clone());
      setTargetText(node.textContent);
      console.log("show menu", node.textContent, el);
    };

    app.on(BlockMenuCmd.check, onShowMenu);

    return () => {
      app.off(BlockMenuCmd.check, onShowMenu);
    };
  }, [app, setTarget, setTargetText]);

  useEffect(() => {
    console.log("target", target);
  }, [target]);


  return <div className="carbon-block-menu">{targetText}</div>;
}
