import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { OptionMenu } from "./OptionMenu";
import "./block-options.styl";

export const BlockOptions = (props: RendererProps) => {
  const app = useCarbon();

  return (
    <div className={"block-options"}>{<OptionMenu {...props} app={app} />}</div>
  );
};