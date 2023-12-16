import { Node, useCarbon } from '@emrgen/carbon-core';
import { useEffect, useState } from 'react';

export const usePlaceholder = (node: Node) => {
  const app = useCarbon();

  const [attributes, setAttributes] = useState<Record<string, string>>({
    placeholder: '',
  });

  useEffect(() => {
    const dataAs = node.attrs.get('html.data-as');
    const placeholder = node.attrs.get('node.emptyPlaceholder') ?? '';
    console.log('xxxxx', node.firstChild?.isEmpty, placeholder);
    if (node.firstChild?.isEmpty && placeholder) {
      setAttributes({
        'placeholder':  placeholder,
      })
    } else if (node.firstChild?.isEmpty && dataAs){
      const type = app.schema.nodes[dataAs];
      console.log('type', type, dataAs, node.attrs.get('node.emptyPlaceholder'), node.firstChild?.isEmpty);
      setAttributes({
        'placeholder': type?.attrs.node.emptyPlaceholder ?? '',
      })
    } else {
      setAttributes({})
    }

    console.log('node.attrs.node.emptyPlaceholder', node.attrs, node.id.toString(), node.name);
  }, [node]);

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

  return attributes
}
