import React, {FC, useEffect} from 'react';
import {Box} from '@chakra-ui/react';

import {useCarbon} from '@emrgen/carbon-react';

export const PathTracker = props => {
  const app = useCarbon();
  const [names, setNames] = React.useState('');

  useEffect(() => {
    const onChange = (state) => {
      const {selection} = state;
      if (selection.isCollapsed) {
        const {head} = selection;
        const nodeNames =head.node.chain.map((node) => node.name).reverse().join(' > ');
        setNames(nodeNames);
      }
    }

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    }
  }, []);

  return <Box pos={'absolute'} top={0} w={'full'} fontSize={'12px'} px={2} py={1}>{names}</Box>;
};
