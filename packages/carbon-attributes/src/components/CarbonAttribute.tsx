import React from 'react'

import { RendererProps } from '@emrgen/carbon-core'
import { Tags } from './Tags';

export default function CarbonProp(props: RendererProps) {
  const {node, prop} = props
  const { name, value } = prop;

  switch (name) {
    case "tags":
      return <Tags node={node} value={value} key={name} />;
    default:
      return value;
  }
}
