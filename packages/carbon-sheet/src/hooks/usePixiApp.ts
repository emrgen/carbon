import { RefObject, useEffect, useState } from 'react';
import { Application } from 'pixi.js';

interface UseAppProps {
  ref: RefObject<any>;
}

export const usePixiApp = (props: UseAppProps) => {
  const { ref } = props;

  const [app] = useState<Application>(() => {
    return new Application({
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: 0xffffff,
      width: 1000,
      height: 600,
    });
  });

  // TODO: this is a hack to get the react to render to the canvas
  useEffect(() => {
    if (ref.current) {
      const { offsetHeight: height, offsetWidth: width } = ref.current;
      app.view.height = height;
      app.view.width = width;
      app.renderer.resize(width, height);
      ref.current.appendChild(app.view);
    }
  }, [app, ref]);

  return app;
}
