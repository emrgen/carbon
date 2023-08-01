import { Carbon, Node, useCarbon } from "@emrgen/carbon-core";
import { useRecoilState } from 'recoil';
import { activeBlockMenuTarget, activeBlockMenuTargetText } from "../atoms";
import { useEffect } from 'react';
import { BlockMenuCmd } from "../types";

export interface UseBlockMenuProps {
  app: Carbon;
  onShow: (node: Node, el: HTMLElement) => void;
  onHide: (node: Node, el: HTMLElement) => void;
}

export const useBlockMenu = (props: UseBlockMenuProps) => {
  const { app, onShow, onHide } = props;

  useEffect(() => {
    app.on(BlockMenuCmd.show, onShow);
    app.on(BlockMenuCmd.hide, onHide);

    return () => {
      app.off(BlockMenuCmd.show, onShow);
      app.off(BlockMenuCmd.hide, onHide);
    };
  }, [app, onHide, onShow]);
}
