<template>
<CarbonNode v-for="child in node.children" :key="child.key" :node="child"/>
</template>

<script lang="ts">
import {Node} from "@emrgen/carbon-core";
export default {
  name: "CarbonChildren",
  props: {
    node: {
      type: Node,
      required: true,
    }
  },

  beforeCreate() {}
}
</script>

<style scoped>

</style>
