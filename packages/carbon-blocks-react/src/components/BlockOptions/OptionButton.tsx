import { preventAndStop } from "@emrgen/carbon-core";
import { ReactNode } from "react";

interface OptionMenuProps {
  children: ReactNode;
  onClick: (e) => void;
}

export const OptionButton = (props: OptionMenuProps) => {
  const { children, onClick } = props;

  return (
    <div
      className={"block-option-button"}
      onClick={onClick}
      onMouseDown={preventAndStop}
    >
      {children}
    </div>
  );
};