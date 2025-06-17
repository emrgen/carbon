<script setup lang="ts">
import {blockPresetPlugins} from '@emrgen/carbon-blocks';
import {CarbonEditor, Node, PinnedSelection, PluginManager, Schema} from '@emrgen/carbon-core';
import {VueNodeFactory, VueState} from '@emrgen/carbon-vue';
import {provide, reactive, ref} from 'vue';
import Person from "./Person.vue";

const node = reactive({
  name: 'Person',
  text: "Hello, World!",
});

const rm = {
  'Person': Person
}

provide('renderManager', rm)


const plugins = [
  ...blockPresetPlugins,
]

const pm = new PluginManager(plugins)
const schema = new Schema(pm.specs, new VueNodeFactory())

const content: Node = schema.type('section').create([
  schema.type('title').create([
    schema.text('Hello, World! 1')!,
  ])!,

  schema.type('section').create([
    schema.type('title').create([
      schema.text('Hello, World! 2')!,
    ])!,
  ])!,
])!;

const state = VueState.create(content, PinnedSelection.NULL);

const app = new CarbonEditor(state, schema, pm);

provide('app', app);

// @ts-ignore
window.app = app


const counter = ref(0);


setTimeout(() => {
  app.cmd.SetContent(content.find(n => n.isText)!, 'Hello, World! 3').Dispatch();
  // console.log('content', content.textContent)
}, 1000);

const data = reactive({
  counter,
  children: [1,2,3,4,5]
});

let interval: any = null;

const update = () => {
  clearInterval(interval);
  ++counter.value
  addSection(counter.value)
  // data.counter++
  // data.children.push(data.children.length + 1)
  // counter.value = counter.value + 1
  // content.find(n => n.isText)?.updateContent('Hello, World! ' + counter.value++);
  // app.cmd.SetContent(content.find(n => n.isText)!, 'Hello, World! ' + counter.value).Dispatch();

}

const addSection = (counter: number) => {
  const section = schema.type('section').create([
    schema.type('title').create([
      schema.text('Hello, World! ' + counter)!,
    ])!,
  ])!
  content.insert(section, 1)
  // content.appendChild(section)
}

const mouseover = () => {
  console.log('mouseover')
  clearInterval(interval)
  interval = setInterval(() => {
    ++counter.value
    addSection(counter.value)
  }, 10);
}

</script>

<template>
  <div id="app">
    <button @click="update" @mouseover="mouseover">Update</button>
<!--    {{content.textContent}}-->
    <CarbonNode :node="app.content"/>
  </div>
</template>

<style scoped>

</style>
