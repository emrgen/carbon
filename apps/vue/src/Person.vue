<template>
  <div>
    <h1>{{node.text}}</h1>
  </div>
</template>

<script>
export default {
  name: "Person",
  props: {
    node: {
      type: Object,
      required: true,
    }
  }
}
</script>

<style scoped>

</style>
