import {parseDom} from "./dom";
import {map} from "lodash";

export const parseHtml = async (item: ClipboardItem) => {
  const type = 'text/html';
  const blob = await item.getType(type);
  const text = await blob.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, type);
  const body = doc.querySelector('body');
  const nodes = map(body?.children, (el) => el) ?? [] as Element[];
  return parseDom(nodes);
}
