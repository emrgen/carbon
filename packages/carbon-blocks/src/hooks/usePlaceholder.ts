import { Node } from '@emrgen/carbon-core';
import { useEffect, useState } from 'react';

export const usePlaceholder = (node: Node) => {
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node.firstChild?.isEmpty && node.attrs.node.emptyPlaceholder) {
      setAttributes({
        'placeholder':  node.attrs.node.emptyPlaceholder,
      });
    } else {
      setAttributes({});
    }
  }, [node]);

  return attributes
}
