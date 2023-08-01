import React, { ForwardedRef, forwardRef } from "react";

const InnerPorterOverlay = (props, forwardedRef: ForwardedRef<any>) => {
  return (
    <div className="fastype-porter-overlay" ref={forwardedRef}>
      PorterOverlay
    </div>
  );
};

export const PorterOverlay = forwardRef(InnerPorterOverlay);
