import {ReactNode} from "react";
import {createPortal} from "react-dom";

export function CarbonPortal(props: {children: ReactNode}) {
  return (
    <>
      {createPortal(<div className={'carbon-portal'}>{props.children}</div>, document.body)}
    </>
  );
}
