import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-core"
import { useEffect } from 'react';
import {
  useDisclosure,
  UseDisclosureReturn,
  usePrevious
} from "@chakra-ui/react";

export const useFastypeOverlay = (disclosure: UseDisclosureReturn) => {
  const { overlay, showOverlay, hideOverlay, ref } = useCarbonOverlay();
  const app = useCarbon();
  const isOpen = usePrevious(disclosure.isOpen);

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
      app.enable()
    }

    if (!isOpen && disclosure.isOpen) {
      console.log("open");
      showOverlay()
      app.disable()
    }
  }, [disclosure.isOpen, hideOverlay, showOverlay, app, isOpen]);

  return {
    overlay,
    ref
  }
};
