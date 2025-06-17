// export const serializeNestableNode = (react: CarbonEditor, node: Node, prefix = '', suffix = ''): SerializedNode => {
//   if (node.isVoid) {
//     throw Error('paragraph is missing title child');
//   }
//   const { children } = node;
//   const contentNode = children[0] as Node;
//   const nodes = children.slice(1);
//   const serializeChildren = nodes.map(n => react.serialize(n));

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
