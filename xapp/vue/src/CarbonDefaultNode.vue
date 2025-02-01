<template>
  <div :data-name="node.name" :data-id="node.key">
    <CarbonChildren :node="node"/>
  </div>
</template>

<script>
import {Node} from "@emrgen/carbon-core";

export default {
  name: "CarbonDefaultNode",
  components: {
  },
  props: {
    node: {
      type: Node,
      required: true,
    }
  },

  beforeCreate() {},

  mounted() {}
}
</script>

<style scoped>

</style>
