<template>
<div data-type="content">
  <CarbonNode :node="node.children[0]"/>
</div>
</template>

<script>
import {Node} from "@emrgen/carbon-core";
export default {
  name: "CarbonContent",
  props: {
    node: {
      type: Node,
      required: true,
    }
  },
}
</script>

<style scoped>

</style>
