import { MarksPath, Node, printNode, Schema, Slice } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { flatten, isEmpty, sortBy } from "lodash";
import { parseHtml } from "./html";
import { fixContentMatch, parseText } from "./text";

let cache: any = null;
let clipboard: any = null;

export async function parseClipboard(schema: Schema): Promise<Optional<Slice>> {
  return new Promise((resolve, reject) => {
    navigator.clipboard.read().then((data) => {
      const processClipboard: (() => Promise<boolean>)[] = [];
      try {
        for (const item of data) {
          console.log("types", item.types);

          let consumed = false;
          const types = sortBy(item.types, (type) =>
            ["web application/carbon", "text/html", "text/plain"].indexOf(type),
          );

          for (const type of types) {
            // parse web application/carbon content to carbon slice
            if (type === "web application/carbon") {
              processClipboard.push(() => {
                return new Promise((done, failed) => {
                  item
                    .getType(type)
                    .then((blob) => {
                      // console.log("web application/carbon", blob);
                      blob
                        .text()
                        .then((text) => {
                          // console.log("web application/carbon", text);
                          const { root, start, end } = JSON.parse(text);
                          const rootNode = schema.nodeFromJSON(root)!;
                          const startNode = schema.nodeFromJSON(start)!;
                          const endNode = schema.nodeFromJSON(end)!;
                          const slice = Slice.create(
                            rootNode,
                            startNode,
                            endNode,
                          );
                          // printNode(slice.root);
                          resolve(slice);
                          done(true);
                        })
                        .catch(failed);
                    })
                    .catch(failed);
                });
              });
            }

            // TODO: parse html content to carbon slice
            if (type === "text/html") {
              processClipboard.push(() => {
                return new Promise((done, failed) => {
                  item
                    .getType(type)
                    .then((blob) => {
                      blob
                        .text()
                        .then((text) => {
                          console.log("text/html", text);
                          const nodes = parseHtml(text);
                          const root = createCarbonSlice(nodes, schema);
                          if (!root) {
                            failed("failed to parse html");
                            return;
                          }
                          const slice = Slice.from(root);
                          resolve(slice);
                        })
                        .catch(failed);
                    })
                    .catch(failed);
                });
              });
            }

            // parse text content to carbon slice
            if (type === "text/plain") {
              processClipboard.push(() => {
                return new Promise((done, failed) => {
                  item
                    .getType(type)
                    .then((blob) => {
                      blob
                        .text()
                        .then((text) => {
                          console.log("test/plain", text);

                          const nodes = parseText(text);
                          const root = createCarbonSlice(nodes, schema);
                          if (!root) {
                            failed("failed to parse text");
                            return;
                          }

                          // console.log("slice", root.toJSON());

                          const slice = Slice.from(root);
                          resolve(slice);
                        })
                        .catch(failed);
                    })
                    .catch(failed);
                });
              });
            }
          }
        }

        if (isEmpty(processClipboard)) {
          resolve(null);
          return;
        }

        // process clipboard data in sequence order
        // if one of the process failed, the next process will be triggered
        // once one of the process success, the rest of the process will be ignored
        const head = processClipboard.reduce(
          (prev, next) => {
            return () =>
              prev().catch((err) => {
                if (err === "initial promise") {
                  return next();
                }

                console.error("clipboard paste error", err);
                return next();
              });
          },
          () => Promise.reject("initial promise") as Promise<boolean>,
        );

        head().catch((e) => {
          console.error("clipboard paste error", e);
          reject(e);
        });
      } catch (e) {
        console.error("clipboard paste error", e);
        reject(e);
      }
    });
  });
}

export const createCarbonSlice = (clipNodes: any[], schema: Schema) => {
  try {
    const nodes = clipNodes.map((n) => schema.nodeFromJSON(n));
    if (isEmpty(nodes)) {
      return null;
    }
    const slice = schema.type("slice").create(nodes as Node[])!;

    console.log("slice", slice);

    const cleaned = fixContentMatch(schema, slice);
    if (isEmpty(cleaned)) {
      return null;
    }

    return cleaned[0];
  } catch (e) {
    clipNodes.forEach((n) => printNode(n, console.error.bind(console)));
    console.error("failed to create carbon slice", e);
    return null;
  }
};

export const transformProcessParsedHtml = (nodes: any[]) => {
  return nodes.map((n) => {
    return transformParsedHtmlNode(n);
  });
};

export const transformParsedHtmlNode = (node: any) => {
  // flatten the inline nodes
  const { metadata } = node;

  // if the node has children, we need to this must be a mark node
  if (
    metadata &&
    metadata.type === "inline" &&
    metadata.group?.includes("mark")
  ) {
    const children = node.children.map((n) => {
      return transformParsedHtmlNode(n);
    });

    return children.map((n) => {
      return {
        ...n,
        props: {
          ...n.props,
          ...node.props,
          [MarksPath]: mergeMarks([n, node]),
        },
      };
    });
  }

  return {
    ...node,
    children: flatten(node.children?.map(transformParsedHtmlNode) ?? []),
  };
};

const mergeMarks = (nodes: any[]) => {
  const marks: any[] = [];
  nodes.forEach((n) => {
    if (n.props?.[MarksPath]) {
      marks.push(...n.props[MarksPath]);
    }
  });

  return marks;
};
