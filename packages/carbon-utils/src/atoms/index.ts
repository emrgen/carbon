import { atom } from 'recoil'
import { Optional } from '@emrgen/types';
import { Node, NodeId } from '@emrgen/carbon-core';

export const activeBlockMenuTarget = atom<Optional<NodeId>>({
  key: 'activeBlockMenuTarget',
  default: null,
})


export const activeBlockMenuTargetText = atom<string>({
  key: 'activeBlockMenuTargetText',
  default: '',
})

export const activeBlockMenuTargetDirty = atom<boolean>({
  key: 'activeBlockMenuTargetDirty',
  default: false,
})
