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
  mounted() {
  },
  updated() {
    console.log(this.node.id.toString(), this.node.textContent)
  }
}
</script>

<style scoped>

</style>
