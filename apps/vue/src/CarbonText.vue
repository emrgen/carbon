<template>
  <span :data-name="node.name" :data-id="node.key">
    {{node.textContent}}
  </span>
</template>

<script>
import {Node} from "@emrgen/carbon-core";

export default {
  name: "CarbonText",
  components: {},
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
