import { useCarbon } from "../hooks/useCarbon";
import { CarbonNode } from "../renderer/CarbonNodes";

// all editor content is rendered inside this component
// events captured from this component is processed in Editor
export function CarbonContent() {
  const app = useCarbon();

  return (
    <>
      <div className="carbon-app-content">
        <CarbonNode node={app.content} />
      </div>
      {/* helper portal for the app */}
    </>
  );
}
