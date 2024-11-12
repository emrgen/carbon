import { Node } from "@emrgen/carbon-core"

export const renderAttr = (node: Node, attr: any) => {
  const { name, value } = attr

  switch (name) {
    // case 'tags': return <TagAttrs node={node} value={value} key={name}/>
    default: return value
  }
}
