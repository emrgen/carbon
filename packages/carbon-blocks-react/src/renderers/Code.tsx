import { CodeThemeNamePath, Node } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import React, { useRef } from "react";

import { themes } from "tm-themes";
import { CodeContentComp } from "./CodeContent";

const themeNames = themes.map((theme) => theme.name);

const getThemeName = (node: Node) => {
  return node.props.get(CodeThemeNamePath, "github-dark");
};

const getThemeType = (themeName: string) => {
  return themes.find((theme) => theme.name === themeName)?.type;
};

export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  console.log(getThemeName(node));

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        ...attributes,
        style: {
          caretColor:
            getThemeType(getThemeName(node)) === "dark" ? "white" : "black",
        },
      }}
    >
      <CarbonChildren node={node} />
      <CodeContentComp node={node.child(0)!} themeName={getThemeName(node)} />
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
