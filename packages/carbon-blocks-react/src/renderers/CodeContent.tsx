import { RendererProps, useNodeChangeObserver } from "@emrgen/carbon-react";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import React, { Fragment, useEffect, useLayoutEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { BundledLanguage } from "shiki/bundle/web";
import { codeToHast } from "shiki/bundle/web";

interface CodeContentProps extends RendererProps {
  themeName?: string;
}

// TODO: use custom tokenization for code blocks, to include text formatting.
export const CodeContentComp = (props: CodeContentProps) => {
  const { node } = useNodeChangeObserver(props);
  const { themeName = "github-dark" } = props;

  return (
    <div className={"carbon-code-block-highlight"}>
      <CodeBlock content={node.textContent} themeName={themeName} lang={"ts"} />
    </div>
  );
};

export function CodeBlock({
  content,
  lang,
  themeName,
}: {
  content: string;
  lang: BundledLanguage;
  themeName: string;
}) {
  const [nodes, setNodes] = useState<any>([]);

  useEffect(() => {}, []);

  useLayoutEffect(() => {
    highlight(content, themeName, lang).then(setNodes);
  }, [lang, content, themeName]);

  return nodes ?? <p>Loading...</p>;
}

export async function highlight(
  code: string,
  themeName: string,
  lang: BundledLanguage,
) {
  const out = await codeToHast(code, {
    lang,
    theme: themeName,
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element;
}