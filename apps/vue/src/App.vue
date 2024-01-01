<script setup lang="ts">
import {blockPresetPlugins} from '@emrgen/carbon-blocks';
import {Carbon, PinnedSelection, PluginManager, Schema} from '@emrgen/carbon-core';
import {VueNodeFactory, VueState} from '@emrgen/carbon-vue';
import CarbonNode from "./CarbonNode.vue";
import {provide, reactive, ref} from 'vue'
import Person from "./Person.vue";

const node = reactive({
  name: 'Person',
  text: "Hello, World!",
})


const rm = {
  'Person': Person
}

provide('renderManager', rm)


const plugins = [
  ...blockPresetPlugins,
]

const pm = new PluginManager(plugins)
const schema = new Schema(pm.specs, new VueNodeFactory())

const content = schema.type('section').create([
  schema.type('title').create([
    schema.text('Hello, World! 1')!,
  ])!,

  schema.type('section').create([
    schema.type('title').create([
      schema.text('Hello, World! 2')!,
    ])!,
  ])!,
])!;

const state = VueState.create(content, PinnedSelection.NULL)

const app = new Carbon(state, schema, pm)

provide('app', app);

// @ts-ignore
window.app = app


const counter = ref(0);


setTimeout(() => {
  app.cmd.SetContent(content.find(n => n.isText)!, 'Hello, World! 3').Dispatch();
  console.log('content', content.textContent)
}, 1000)

const update = () => {
  counter.value = counter.value + 1
}


</script>

<template>
  <div id="app">
    <CarbonNode :node="app.content"/>
  </div>
</template>

<style scoped>

</style>
