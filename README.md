# Carbon
A Extendable editor framework.

[Demo](http:://emrgen.github.io/carbon/)



# Example 
```ts
const renderManager = RenderManager.from(flattenDeep(renderers));

export function App() {
  const app = useCreateCarbon("dev", content, flattenDeep(plugins));

  return (
    <CarbonApp app={app} renderManager={renderManager} />
  );
}
```
