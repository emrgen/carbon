import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Person from "./Person.vue";
import CarbonNode from "./CarbonNode.vue";
import CarbonNodeContent from "./CarbonNodeContent.vue";
import CarbonNodeChildren from "./CarbonNodeChildren.vue";
import CarbonChildren from "./CarbonChildren.vue";
import CarbonText from "./CarbonText.vue";

const app = createApp(App)

app.component('Person', Person);
// app.component('Text', CarbonText)
// app.component('', CarbonText)
app.component('CarbonNode', CarbonNode);
app.component('CarbonText', CarbonText);
app.component('CarbonChildren', CarbonChildren);
app.component('CarbonNodeContent', CarbonNodeContent);
app.component('CarbonNodeChildren', CarbonNodeChildren);

app.mount('#app')

