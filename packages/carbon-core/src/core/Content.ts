import {NodeData, Path} from "@emrgen/carbon-core";
import {each, get, isEmpty, set} from "lodash";

export class Content {
  static atPath(root: NodeData, path: Path): NodeData|undefined {
    if (isEmpty(path)) {
      return root;
    }

    if (typeof path[0] === 'number') {
      return Content.atPath(root.children![path[0]], path.slice(1))
    } else if (typeof path[0] === 'string') {
      return Content.atPath(root.links![path[0]], path.slice(1))
    }
  }

  static insert(root: NodeData, path: Path, child: NodeData, mutable = true): NodeData {
    const data = Content.atPath(root, path.slice(0, -1));
    const offset = path[path.length - 1];
    if (data) {
      const node = data as NodeData;
      if (Content.isText(node)) {
        throw new Error("Cannot insert into text node")
      }

      if (typeof offset === "string") {
        if (isEmpty(node.links)) {
          node.links = {}
        }
        node.links[offset] = child
      } else {
        if (isEmpty(node.children)) {
          node.children = []
        }
        node.children = [...node.children!.slice(0, offset), child, ...node.children!.slice(offset)]
      }
    }
    return root;
  }

  static remove(root: NodeData, path: Path, mutable = true) {
    const data = Content.atPath(root, path.slice(0, -1));
    if (data) {
      const parent = data as NodeData;
      const offset = path[path.length - 1];
      if (typeof offset === "string") {
        delete parent.links?.[offset];
      } else {
        parent.children?.splice(offset, 1);
      }
    }
  }

  static updateContent(root: NodeData, path: Path, content: NodeData[]|string, mutable = true) {
    const data = Content.atPath(root, path);
    if (data) {
      const node = data as NodeData;
      if (typeof content === "string") {
        node.textContent = content
      } else {
        node.children = content
      }
    }
  }

  static removeText(root: NodeData, path: Path, length: number): string {
    const data = Content.atPath(root, path.slice(0, -1));
    if (data) {
      const parent = data as NodeData;
      const offset = path[path.length - 1];
      if (typeof offset === "number") {
        const text = parent.links?.[offset]?.textContent ?? '';
        parent.textContent = text.slice(0, offset) + text.slice(offset + length)
        return text.slice(offset, offset + length)
      } else {
        throw new Error("Cannot remove text without number offset")
      }
    }

    return ""
  }

  static insertText(root: NodeData, path: Path, text: string, mutable = true) {
    const data = Content.atPath(root, path.slice(0, -1));
    if (data) {
      const parent = data as NodeData;
      const offset = path[path.length - 1];
      if (typeof offset === "number") {
        const textContent = parent.textContent ?? '';
        parent.textContent = textContent.slice(0, offset) + text + textContent.slice(offset);
      } else {
        throw new Error("Cannot remove text without number offset");
      }
    }
  }

  static updateProps(root: NodeData, path: Path, props: Record<string, any>, mutable = true) {
    const data = Content.atPath(root, path)
    if (data) {
      const node = data as NodeData;
      if (isEmpty(node.props)) {
        node.props = {}
      }

      each(props, (value, key) => {
        node.props![key] = value
      })
    }
  }

  static textContent(root: NodeData, path?: Path): string {
    if (path && !isEmpty(path)) {
      const data = Content.atPath(root, path);
      if (data) {
        return Content.textContent(data as NodeData, [])
      }
    }

    if(Content.isText(root)) {
      return root.textContent ?? ""
    } else {
      return root.children?.map(d => Content.textContent(d)).join("") ?? ""
    }
  }

  static isText(node: NodeData): boolean {
    return node.name === "text" && !node.children?.length
  }

  static isContainer(node: NodeData): boolean {
    return node.name !== "text"
  }
}

export class ImmutableContent {

}
