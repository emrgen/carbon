import { Carbon, Node } from "@emrgen/carbon-core";
import { useRecoilState } from 'recoil';
import { activeBlockMenuTarget, activeBlockMenuTargetText } from "../atoms";
import { useEffect } from 'react';
import { BlockMenuCmd } from "../types";

export interface UseBlockMenuProps {
  app: Carbon;
  onShow: (node: Node, el: HTMLElement) => void;
  onHide: (node: Node, el: HTMLElement) => void;
  onSelect: (node: Node, el: HTMLElement) => void;
  onScroll: (direction: 'up' | 'down') => void;
}

export const useBlockMenu = (props: UseBlockMenuProps) => {
  const { app, onShow, onHide, onSelect, onScroll } = props;


  useEffect(() => {
    const handleScrollUp = (e: Event) => {
      onScroll('up');
    };

    const handleScrollDown = (e: Event) => {
      onScroll('down');
    };


    app.on(BlockMenuCmd.scrollDown, handleScrollDown);
    app.on(BlockMenuCmd.scrollUp, handleScrollUp);
    app.on(BlockMenuCmd.select, onSelect);
    app.on(BlockMenuCmd.show, onShow);
    app.on(BlockMenuCmd.hide, onHide);

    return () => {
      app.off(BlockMenuCmd.scrollDown, handleScrollDown);
      app.off(BlockMenuCmd.scrollUp, handleScrollUp);
      app.off(BlockMenuCmd.select, onSelect);
      app.off(BlockMenuCmd.show, onShow);
      app.off(BlockMenuCmd.hide, onHide);
    };
  }, [app, onHide, onScroll, onSelect, onShow]);
}
