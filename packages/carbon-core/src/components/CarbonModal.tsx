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

  if (isOpen && overlay.ref.current) {
    return PortalReactDOM.createPortal(<div className="carbon-modal">{props.children}</div>, overlay.ref.current!);
  }

  return null;
};
