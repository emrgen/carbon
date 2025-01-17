import { RendererProps, useNodeChangeObserver } from "@emrgen/carbon-react";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { codeToHast } from "shiki";
import type { BundledLanguage } from "shiki/bundle/web";
import { R } from "shiki/types/index.d.mjs";

export const getLineNumberClass = (lineNumber: number) => {
  if (lineNumber < 10) {
    return "line-numbers-1";
  } else if (lineNumber < 100) {
    return "line-numbers-2";
  } else {
    return "line-numbers-3";
  }
};

interface CodeContentProps extends RendererProps {
  themeName?: string;
  language?: string;
  onChangeLineNumber?: (lineNumber: number) => void;
}

// TODO: use custom tokenization for code blocks, to include text formatting.
export const CodeHighlight = (props: CodeContentProps) => {
  const { onChangeLineNumber } = props;
  const { node } = useNodeChangeObserver(props);
  const { themeName = "github-dark", language = "ts" } = props;

  const lineNumber = useMemo(() => {
    return node.textContent.split("\n").length;
  }, [node.textContent]);

  useEffect(() => {
    if (onChangeLineNumber) {
      onChangeLineNumber(lineNumber);
    }
  }, [lineNumber, onChangeLineNumber]);

  const lineNumberClass = useMemo(() => {
    return getLineNumberClass(lineNumber);
  }, [lineNumber]);

  return (
    <div
      className={"carbon-code-block-highlight " + lineNumberClass}
      contentEditable={false}
      suppressContentEditableWarning={true}
    >
      <CodeBlock
        id={node.id.toString()}
        content={node.textContent}
        themeName={themeName}
        lang={language}
      />
    </div>
  );
};

// cache the code blocks after they are highlighted
// NOTE: without this, the code blocks will be re-highlighted on every render
// which causes a flicker effect
const elsMap = new Map<string, JSX.Element>();
const contentMap = new Map<string, string>();

const codeKey = (id: string, lang: string, themeName: string) =>
  `${id}:${lang}:${themeName}`;

function CodeBlock({
  id,
  content,
  lang,
  themeName,
}: {
  id: string;
  content: string;
  lang: BundledLanguage;
  themeName: string;
}) {
  const [els, setEls] = useState<JSX.Element | null>(null);
  const key = codeKey(id, lang, themeName);

  useEffect(() => {
    // If the content and the theme is the same, don't re-highlight.
    if (contentMap.has(key) && contentMap.get(key) === content) {
      return;
    }

    highlight(content, themeName, lang).then((nodes) => {
      elsMap[key] = nodes;
      setEls(nodes);
    });

    contentMap.set(key, content);
  }, [lang, content, themeName, key]);

  return elsMap[key] || els || null;
}

// TODO: use language loader to load the all tm languages.
export async function highlight(
  code: string,
  themeName: string,
  lang: BundledLanguage,
) {
  const out = await codeToHast(code, {
    lang,
    theme: themeName,
  });

  const transformed = transformRoot(out);

  return toJsxRuntime(transformed, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element;
}

function transformRoot(root: R) {
  return {
    ...root,
    children: root.children.map(transformNode),
  };
}

function transformNode(node: any) {
  if (node.type === "element" && node.tagName === "code") {
    let lineNumber = 1;
    return {
      ...node,
      children: node.children.map((line, index) => {
        if (line.value === "\n") {
          lineNumber += 1;
          return line;
        }

        return transformLine(line, lineNumber);
      }),
    };
  }

  if (node.children) {
    return {
      ...node,
      children: node.children.map(transformNode),
    };
  }

  return node;
}

// Highlight the matching lines
function transformLine(line: any, lineNumber: number) {
  return {
    ...line,
    properties: {
      ...line.properties,
      id: [2, 3, 4].includes(lineNumber) ? "line-highlight" : "",
    },
  };
}
