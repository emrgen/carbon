# Carbon
A Extendable editor framework.

[Demo](https://emrgen.github.io/carbon/)

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


## NOTE
This project is under active development and is not ready for production use.
