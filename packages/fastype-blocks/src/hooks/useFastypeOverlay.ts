import { Node, useCarbon, useCarbonOverlay } from "@emrgen/carbon-core"
import { useEffect } from 'react';
import {
  useDisclosure,
  UseDisclosureReturn,
  usePrevious
} from "@chakra-ui/react";

export const useFastypeOverlay = (disclosure: UseDisclosureReturn, node?: Node) => {
  const { overlay, showOverlay, hideOverlay, ref, setNode } = useCarbonOverlay();
  const app = useCarbon();
  const isOpen = usePrevious(disclosure.isOpen);

  useEffect(() => {
    if (node) {
      setNode(node);
    }
  }, [node, setNode]);

  useEffect(() => {
    const onClick = (e) => {
      disclosure.onClose();
    };

    overlay.on("click", onClick);
    return () => {
      overlay.off("click", onClick);
    };
  }, [overlay, disclosure]);

  useEffect(() => {
    if (isOpen && !disclosure.isOpen) {
      console.log("close");
      hideOverlay()
      setNode(null)
      app.enable()
    }

    if (!isOpen && disclosure.isOpen) {
      console.log("open");
      showOverlay()
      app.disable()
      setNode(node);
    }
  }, [disclosure.isOpen, hideOverlay, showOverlay, app, isOpen, node, setNode]);

  return {
    overlay,
    ref
  }
};
