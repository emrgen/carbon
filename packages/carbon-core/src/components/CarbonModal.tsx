import React, { useEffect } from "react";
import { useCarbonOverlay } from "../hooks/useCarbonOverlay";
import PortalReactDOM from "react-dom";

export const CarbonModal = (props) => {
  const { isOpen } = props;
  const overlay = useCarbonOverlay();
  useEffect(() => {
    if (isOpen) {
      overlay.showOverlay();
    } else {
      overlay.hideOverlay();
    }
    return () => {
      overlay.hideOverlay();
    };
  }, [overlay, isOpen]);

  return isOpen && overlay.ref.current
    ? PortalReactDOM.createPortal(
        <div className="carbon-modal">{props.children}</div>,
        overlay.ref.current!
      )
    : null;
};
