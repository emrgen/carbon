import { CodeLanguagePath, CodeThemeNamePath, Node } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { isEqual } from "lodash";
import React, { useCallback, useRef, useState } from "react";
import { grammars } from "tm-grammars";

import { themes } from "tm-themes";

import { CodeContentComp, getLineNumberClass } from "./CodeContent";

const themeNames = themes.map((theme) => theme.name);

const langNames = grammars.map((lang) => lang.name);

const getThemeName = (node: Node) => {
  return node.props.get(CodeThemeNamePath, "github-dark");
};

const getLangName = (node: Node) => {
  return node.props.get(CodeLanguagePath, "ts");
};

const getThemeType = (themeName: string) => {
  return themes.find((theme) => theme.name === themeName)?.type;
};

export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);
  const [lineNumberClass, setLineNumberClass] = useState("line-numbers-1");

  const onChangeLineNumber = useCallback((lineNumber: number) => {
    console.log("lineNumber", lineNumber, getLineNumberClass(lineNumber));
    setLineNumberClass(getLineNumberClass(lineNumber));
  }, []);

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
        className: lineNumberClass,
      }}
      comp={(prev, next) => {
        return (
          prev.node.key === next.node.key && isEqual(prev.custom, next.custom)
        );
      }}
    >
      <CarbonChildren node={node} />
      <CodeContentComp
        node={node.child(0)!}
        themeName={getThemeName(node)}
        language={getLangName(node)}
        onChangeLineNumber={onChangeLineNumber}
      />
      <select
        contentEditable={false}
        suppressContentEditableWarning={true}
        name="carbon-code-themes"
        id="carbon-code-themes"
        onChange={(e) => {
          e.stopPropagation();
          app.cmd
            .Update(node, {
              [CodeLanguagePath]: e.target.value,
            })
            .Dispatch();
        }}
        value={node.props.get(CodeLanguagePath, "ts")}
      >
        {langNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {SelectionHalo}
    </CarbonBlock>
  );
};
