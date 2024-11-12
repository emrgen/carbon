import { Carbon, preventAndStop } from "@emrgen/carbon-core";
import { RendererProps } from "@emrgen/carbon-react";
import { useCallback } from "react";
import { SlOptions } from "react-icons/sl";
import { OptionButton } from "./OptionButton";

interface OptionMenuProps extends RendererProps {
  app: Carbon;
}

export const OptionMenu = (props: OptionMenuProps) => {
  const { app, node } = props;

  const handleClick = useCallback(
    (e) => {
      preventAndStop(e);

      app.emit("show:context:menu", {
        node,
        event: new MouseEvent("click"),
        placement: "right-start",
      });
    },
    [app, node],
  );

  return (
    <OptionButton onClick={handleClick}>
      <SlOptions />
    </OptionButton>
  );
};