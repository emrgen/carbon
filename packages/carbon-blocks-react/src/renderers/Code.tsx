import { CodeThemeNamePath } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import React, { useMemo, useRef } from "react";

import { themes } from "tm-themes";
import { CodeContentComp } from "./CodeContent";

const themeNames = themes.map((theme) => theme.name);

export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  const themeName = useMemo(() => {
    return node.props.get(CodeThemeNamePath, "github-dark");
  }, [node]);

  const theme = useMemo(() => {
    return themes.find((theme) => theme.name === themeName);
  }, [themeName]);

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        ...attributes,
        style: { caretColor: theme?.type === "dark" ? "white" : "black" },
      }}
    >
      <CarbonChildren node={node} />
      <CodeContentComp node={node.child(0)!} themeName={themeName} />
      <select
        contentEditable={false}
        suppressContentEditableWarning={true}
        name="carbon-code-themes"
        id="carbon-code-themes"
        onChange={(e) => {
          e.stopPropagation();
          app.cmd
            .Update(node, {
              [CodeThemeNamePath]: e.target.value,
            })
            .Dispatch();
        }}
        value={node.props.get(CodeThemeNamePath)}
      >
        {themeNames.map((themeName) => (
          <option key={themeName} value={themeName}>
            {themeName}
          </option>
        ))}
      </select>
      {SelectionHalo}
    </CarbonBlock>
  );
};
