import { Node, useCarbon } from '@emrgen/carbon-core';
import { useEffect, useState } from 'react';

export const usePlaceholder = (node: Node) => {
  const app = useCarbon();

  const dataAs = node.attrs.get('html.data-as');
  if (node.firstChild?.isEmpty && node.attrs.node.emptyPlaceholder) {
    return {
      'placeholder':  node.attrs.node.emptyPlaceholder ?? '',
    };
  } else if (node.firstChild?.isEmpty && dataAs){
    const type = app.schema.nodes[dataAs];
    return {
      'placeholder': type?.attrs.node.emptyPlaceholder ?? '',
    };
  } else {
    return {};
  }
  // const [attributes, setAttributes] = useState<Record<string, string>>({});

  // useEffect(() => {
  //   if (node.firstChild?.isEmpty && node.attrs.node.emptyPlaceholder) {
  //     setAttributes({
  //       'placeholder':  node.attrs.node.emptyPlaceholder ?? '',
  //     });
  //   } else {
  //     setAttributes({});
  //   }
  // }, [node]);

  // return attributes
}
