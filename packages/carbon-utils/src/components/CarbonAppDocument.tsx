import {Carbon, preventAndStop, RenderManager} from "@emrgen/carbon-core";
import {ReactNode, useEffect, useRef} from "react";
import { RecoilRoot } from "recoil";


import { DndContext, RectSelectContext } from "@emrgen/carbon-dragon";
import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  CarbonEvents,
  CarbonOverlayContext,
  RenderManagerContext
} from "@emrgen/carbon-react";

interface CarbonAppProps {
  app: Carbon;
  renderManager: RenderManager;
  children?: ReactNode;
}

export function CarbonApp(props: CarbonAppProps) {
  const { app, children } = props;
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
      <DndContext>
      <RenderManagerContext manager={props.renderManager}>
        <CarbonOverlayContext>
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
                    <CarbonContent />
                    {children}
                  </RectSelectContext>
                </CarbonChangeContext>
              </CarbonEvents>
            </RecoilRoot>
          </CarbonOverlayContext>
        </RenderManagerContext>
      </DndContext>
    </CarbonContext>
  );
}
