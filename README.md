# Carbon
A extendable editor framework.

# Demo video



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
