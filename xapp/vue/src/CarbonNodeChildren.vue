<template>
<div data-type="children"> v-for="child in node.children.slice(0)" :key="child.key">
  <CarbonNode :node="child"/>
</div>
</template>

<script>
import {Node} from "@emrgen/carbon-core";

export default {
  name: "CarbonNodeChildren",
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
