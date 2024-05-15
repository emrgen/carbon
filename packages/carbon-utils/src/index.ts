import { Extension } from '@emrgen/carbon-react'
import { BlockMenuPlugin } from './plugins'

export * from './components'
export * from './plugins'
export * from './hooks'
export * from './types'

export const carbonUtilPlugins: Extension = {
  plugins: [
    // new BlockMenuPlugin(),
  ]
}
