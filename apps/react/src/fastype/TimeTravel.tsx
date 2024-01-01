import { Carbon, SelectAction, TransactionNode, TransactionTree } from '@emrgen/carbon-core';
import React, { useCallback, useEffect } from 'react'
import treeify from 'object-treeify';
import { Box, Center, Flex, HStack, Stack, Textarea } from "@chakra-ui/react";

export interface TimeTravelProps {
  app: Carbon;
}

export default function TimeTravel(props: TimeTravelProps) {
  const { app } = props;

  const [tree, setTree] = React.useState<TransactionTree | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [intervals, setIntervals] = React.useState<any[]>([]);

  useEffect(() => {
    const onTimeTravel = (tree: TransactionTree) => {
      const json = tree.toJSON();
      const treeString = treeify(json, {
        sortFn: (a, b) => {
          return parseInt(a) - parseInt(b);
        }
      });

      // setCurrent(tree.current?.transaction.id ?? 0);
      setTree(tree);
    }

    app.on('timeTravel', onTimeTravel);

    return () => {
      app.off('timeTravel', onTimeTravel);
    }

  }, [app]);

  const onTravel = (id: number) => {
    app.blur();
    console.log('travel to ', id);
    const trs = tree?.moveTo(id);
    console.log(trs);

    intervals.forEach(interval => {
      clearInterval(interval);
    });

    trs?.forEach(tr => {
      // const change = tr.filter(a => !(a instanceof SelectAction))
      // change.readOnly = true;
      // change.Dispatch();
    });

    app.emit('timeTravel', tree);

    // let counter = 0
    // let newIntervals = [];
    // trs?.forEach(tr => {
    //   const change = tr.filter(a => !(a instanceof SelectAction))
    //   change.readOnly = true;

    //   const interval = setTimeout(() => {
    //     change.Dispatch();
    //
    //   }, counter * 400);
    //   newIntervals.push(interval);
    //   counter += 2;
    // });

    // setIntervals(newIntervals);
  }

  return (
    <TimeTravelContext.Provider value={{current, onTravel}}>
    <Stack h='full' w='full' pos={'absolute'} overflow={'auto'} px={2} pb={4}>
      <Center>TimeTravel</Center>
      <Box fontSize={'xs'}>Current tid: <b>{current}</b></Box>
      {/* <Box fontSize={'2xs'}><pre>{tree}</pre></Box> */}
      <Box fontSize={'xs'}>
        {tree?.root && <TransactionNodeComp node={tree.root} />}
      </Box>
    </Stack>
    </TimeTravelContext.Provider>
  )
}

const TimeTravelContext = React.createContext<any>({
  current: 0,
  onTravel: (id: number) => {}
});

const useTimeTravel = () => {
  return React.useContext(TimeTravelContext);
}


const TransactionNodeComp = (props) => {
  const { node, selfIndex, lastIndex } = props;
  const {current, onTravel} = useTimeTravel();

  const hasChildren = node.children.length > 0;

  const handleTravelTo = useCallback(() => {
    onTravel(node.transaction.id);
  }, [node.transaction.id, onTravel])

  return (
    <Stack spacing={0} justify={'flex-start'} className={'group'}>
      <Box>
        <Flex
        display={'inline'}
        mr={'4px'}
        p={'2px'}
        px={'3px'}
        boxShadow={node.transaction.id == current ? '0 0 0 2px red': ''}
        onClick={handleTravelTo} cursor={'pointer'}
        _hover={{
          bg: 'gray.200'
        }}
        >
          {node.transaction.id}
        </Flex>
      </Box>
      {hasChildren && <>
        <HStack spacing={0} pos='relative' align={'start'}>
          {node.children.map((child, index) => {
            return (
              <HStack align={'start'} key={child.transaction.id}>
                {/* <Box ml={'6px'} h='full' w={'1px'} position={'absolute'} bg={'#555'} top={0}/> */}
                {/*<Box transform={'translateX(6px)'} pl={'2px'}>-</Box>*/}
                <TransactionNodeComp node={child} selfIndex={index} lastIndex={node.children.length-1}/>
              </HStack>
            )
          })}
        </HStack>
      </>}
    </Stack>
  )
}
