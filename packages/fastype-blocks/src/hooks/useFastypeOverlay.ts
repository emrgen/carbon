import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-core"
import { useEffect } from 'react';
import {
  useDisclosure,
  UseDisclosureReturn
} from "@chakra-ui/react";

export const useFastypeOverlay = (disclosure: UseDisclosureReturn) => {
  const { overlay, showOverlay, hideOverlay } = useCarbonOverlay();
  const app = useCarbon();

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
    if (disclosure.isOpen) {
      showOverlay()
      app.disable()
    } else {
      hideOverlay()
      app.enable()
    }
  }, [disclosure.isOpen, hideOverlay, showOverlay, app]);

  return overlay;
};
