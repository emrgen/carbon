import React from 'react'

import { RendererProps } from '@emrgen/carbon-core'
import { Tags } from './Tags';

export default function CarbonAttribute(props: RendererProps) {
  const {node, attr} = props
  const { name, value } = attr;

  switch (name) {
    case "tags":
      return <Tags node={node} value={value} key={name} />;
    default:
      return value;
  }
}
