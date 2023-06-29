import { Carbon, Fragment, Node, SerializedNode } from "@emrgen/carbon-core";
import { isString } from 'lodash';

// export const serializeNestableNode = (app: Carbon, node: Node, prefix = '', suffix = ''): SerializedNode => {
//   if (node.isVoid) {
//     throw Error('section is missing title child');
//   }
//   const { children } = node;
//   const contentNode = children[0] as Node;
//   const nodes = children.slice(1);
//   const serializeChildren = nodes.map(n => app.serialize(n));

//   if (contentNode.isEmpty) {
//     return serializeChildren;
//   }

//   const serializeContent = prefix + contentNode.textContent + suffix;

//   return [
//     serializeContent,
//     serializeChildren
//   ]
//   // return node.child(0)?.textContent ?? ''
// }
