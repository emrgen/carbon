import { Box, Textarea } from '@chakra-ui/react'
import { Carbon, Node } from '@emrgen/carbon-core'
import React, { useEffect } from 'react'

interface FastTreeProps {
  app: Carbon
}

const intoTree = (content: Node) => {
  let root = 'root';

  root += "\n  └ " + processNode(content, 1, [1]);

  return root
}

const processNode = (node: Node, depth = 0, count = [1]) => {
  let result = '';

  if (node.name === 'text') {
    result += `${count[0]} text ` + `"${node.textContent}"`
  } else {
    result += `(${count[0]}) ` + node.name
  }

  if (node.children.length > 0) {
    result += ''

    for (const child of node.children) {
      count[0] += 1
      result +=
        "\n" +
        "  ".repeat(2 * depth) +
        "└ " +
        processNode(child, depth + 1, count);
    }

    result += ''
  }

  return result
}


export default function FastTree(props: FastTreeProps) {
  const {app} = props

  const [state, setState] = React.useState(intoTree(app.content));

  useEffect(() => {
    const onChange = () => {
      setState(intoTree(app.content));
    }

    app.on("change", onChange);
    return () => {
      app.off("change", onChange);
    }
  }, [app])

  return (
    <Box h={'full'} overflow={'auto'} p={0}>
      <Textarea value={state} h='full' fontSize={'xs'}/>
    </Box>
  )
}
