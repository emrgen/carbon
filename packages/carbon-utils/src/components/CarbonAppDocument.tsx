import {Carbon} from "@emrgen/carbon-core";
import {ReactNode, useEffect, useRef} from "react";
import {RecoilRoot} from "recoil";
import {DndContext, RectSelectContext} from "@emrgen/carbon-dragon-react";
import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  CarbonEvents,
  CarbonOverlayContext,
  RenderManager,
  RenderManagerContext
} from "@emrgen/carbon-react";

interface CarbonAppProps {
  app: Carbon;
  renderManager: RenderManager;
  children?: ReactNode;
}

export function CarbonApp(props: CarbonAppProps) {
  const {app, children} = props;
  // @ts-ignore
  window.app = app;
  // console.log(react.content)
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    app.focus();
    app.mounted()
  }, [app]);

  useEffect(() => {
    if (ref.current) {
      app.setCursorRest(ref.current);
    }
  }, [app, ref]);

  return (
    <CarbonContext app={app}>
      <CarbonOverlayContext>
        <DndContext>
          <RenderManagerContext manager={props.renderManager}>
            <RecoilRoot>
              <CarbonEvents>
                <div
                  ref={ref}
                  className="carbon-app-cursor-rest"
                  contentEditable={true}
                  suppressContentEditableWarning
                  // onKeyDown={preventAndStop}
                  // onKeyUp={preventAndStop}
                ></div>
                <CarbonChangeContext>
                  <RectSelectContext>
                    <CarbonContent/>
                    {children}
                  </RectSelectContext>
                </CarbonChangeContext>
              </CarbonEvents>
            </RecoilRoot>
          </RenderManagerContext>
        </DndContext>
      </CarbonOverlayContext>
    </CarbonContext>
  );
}
