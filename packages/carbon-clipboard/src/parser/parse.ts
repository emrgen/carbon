import { Node, Schema, Slice } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { fixContentMatch, parseText } from "./text";
import { isEmpty, sortBy } from "lodash";
import { parseHtml } from "./html";

export async function parseClipboard(schema: Schema): Promise<Optional<Slice>> {
  return new Promise((resolve, reject) => {
    navigator.clipboard.read().then((data) => {
      try {
        for (const item of data) {
          console.log("types", item.types);

          let consumed = false;
          const types = sortBy(item.types, (type) =>
            ["web application/carbon", "text/html", "text/plain"].indexOf(type),
          );

          for (const type of types) {
            // parse web application/carbon content to carbon slice
            if (!consumed && type === "web application/carbon") {
              item.getType(type).then((blob) => {
                blob.text().then((text) => {
                  const { root, start, end } = JSON.parse(text);
                  const rootNode = schema.nodeFromJSON(root)!;
                  const startNode = schema.nodeFromJSON(start)!;
                  const endNode = schema.nodeFromJSON(end)!;
                  const slice = Slice.create(rootNode, startNode, endNode);
                  // console.log("slice", slice);
                  resolve(slice);
                });
              });
            }

            // TODO: parse html content to carbon slice
            if (!consumed && type === "text/html") {
              item.getType(type).then((blob) => {
                blob.text().then((text) => {
                  console.log("test/html", text);

                  const nodes = parseHtml(text);
                  const root = createCarbonSlice(nodes, schema);
                  if (!root) {
                    return;
                  }
                  const slice = Slice.from(root);
                  resolve(slice);
                });
              });
              // break;
            }

            // parse text content to carbon slice
            if (!consumed && type === "text/plain") {
              item.getType(type).then((blob) => {
                blob.text().then((text) => {
                  console.log("test/plain", text);

                  const nodes = parseText(text);
                  const root = createCarbonSlice(nodes, schema);
                  if (!root) {
                    resolve(null);
                    return;
                  }

                  console.log("slice", root.toJSON());

                  const slice = Slice.from(root);
                  resolve(slice);
                });
              });
              // break;
            }
          }
        }
      } catch (e) {
        console.error("clipboard paste error", e);
        reject(e);
      }
    });

    // navigator.clipboard.readText().then(text => {
    //   marked.parse(text, {
    //     walkTokens(token) {
    //       console.log('token', token);
    //     },
    //   });
    //
    //   console.log('clipboard paste');
    //   console.log(text)
    // });
  });
}

export const createCarbonSlice = (clipNodes: any[], schema: Schema) => {
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
};
