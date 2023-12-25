import { Optional } from '@emrgen/types';
import { MutableRefObject } from 'react';
import { useDraggable } from './useDraggable';
import { useDroppable } from './useDroppable';
import { Node } from '@emrgen/carbon-core';

export interface UseDragDropProps {
  ref: MutableRefObject<Optional<HTMLElement>>;
  node: Node;
}

export const useDragDrop = (props: UseDragDropProps) => {
  useDraggable(props)
  useDroppable(props)
};
