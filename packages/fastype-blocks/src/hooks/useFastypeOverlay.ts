import { UseDisclosureReturn, usePrevious } from "@chakra-ui/react";
import { Node } from "@emrgen/carbon-core";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect } from "react";

interface UseFastypeOverlayProps {
  disclosure: UseDisclosureReturn;
  node: Node;
  onOpen?(): void;
  onClose?(): void;
}

export const useFastypeOverlay = (props: UseFastypeOverlayProps) => {
  const { disclosure, node, onClose, onOpen } = props;

  const { overlay, showOverlay, hideOverlay, ref, setNode } =
    useCarbonOverlay();
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
  }, [overlay, disclosure, app, node]);

  useEffect(() => {
    if (isOpen && !disclosure.isOpen) {
      console.log("close");
      hideOverlay();
      setNode(null);
      app.enable();
      onClose?.();
    }

    if (!isOpen && disclosure.isOpen) {
      console.log("open");
      onOpen?.();
      app.disable();
      setNode(node);
      showOverlay();
    }
  }, [
    disclosure.isOpen,
    hideOverlay,
    showOverlay,
    app,
    isOpen,
    node,
    setNode,
    onClose,
    onOpen,
  ]);

  return {
    overlay,
    ref,
  };
};
