<script lang="ts">

import {Node, NodeChangeType} from "@emrgen/carbon-core";
import {Component, h, inject} from "vue";
import CarbonDefaultNode from "./CarbonDefaultNode.vue";
import CarbonText from "./CarbonText.vue";

export default {
  name: 'CarbonNode',
  inject: ['app'],
  props: {
    node: {
      type: Node,
      required: true,
    }
  },
  data(): any {
    return {
      dataNode: {},
    }
  },
  setup(props: any) {
    const {node} = props;

    if (node.name === 'text') {
      return () => h(CarbonText, {
        node,
      });
    }

    const rm = inject('renderManager') as Record<string, Component>
    const component = rm[node.name]!;
    // console.log('name:', node.name, 'component:', component)

    if (!component || component.name === 'CarbonNode') {
      return () => h(CarbonDefaultNode, {
        node,
      });
    }

    return () => h(component, {
      node,
    });
  },

  methods: {
    onChange(node: Node) {
      console.log('onChange', node.id.toString())
      // console.log('this', this.app)
      // const app = inject('app') as CarbonEditor;
      this.app.change.mounted(node, NodeChangeType.update);
    }
  },

  mounted() {
    this.app.change.on(this.node.id, NodeChangeType.update, this.onChange.bind(this));
  },
  beforeUnmount() {
    // const app = inject('app') as CarbonEditor;
    this.app.change.offAll(this.node.id);
  }
}
</script>

<style scoped>

</style>
