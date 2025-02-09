import { Portal } from "@chakra-ui/react";
import {
  createContext,
  MutableRefObject,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactPlayer from "react-player";

interface ReactPlayerRenderProps {
  src: string;
  parentRef: MutableRefObject<any>;
}

interface ReactPlayerContextInnerProps {
  render: ({ src, parentRef }: ReactPlayerRenderProps) => ReactElement | null;
}

export const ReactPlayerContextInner = createContext<ReactPlayerContextInnerProps>({
  render: () => null,
});

const playerMap = {};

export const ReactPlayerContext = ({ children }) => {
  const playerRef = useRef(null);
  const [bus, setBus] = useState(new QueuedEventEmitter());

  const render = useCallback(
    ({ src, parentRef }: ReactPlayerRenderProps) => {
      bus.emit("render", { src, parentRef });
      return null;
    },
    [bus],
  );

  return (
    <ReactPlayerContextInner.Provider
      value={{
        render,
      }}
    >
      {children}
      <ReactPlayerPrerenderStage bus={bus} />
    </ReactPlayerContextInner.Provider>
  );
};

interface ReactPlayerPrerenderStageProps {
  bus: QueuedEventEmitter;
}

const ReactPlayerPrerenderStage = ({ bus }: ReactPlayerPrerenderStageProps) => {
  const ref = useRef(null);

  const parentRefs = useRef<Record<string, MutableRefObject<any>>>({});
  const playerRefs = useRef<Record<string, MutableRefObject<any>>>({});
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    console.log("register onRender");
    const onRender = ({ src, parentRef }: ReactPlayerRenderProps) => {
      console.log("onRender");
      // if (parentRefs.current[src]?.current === parentRef?.current) {
      //   return;
      // }
      parentRefs.current[src] = parentRef;
      setUrls((urls) => [...urls, src]);
    };

    bus.on("render", onRender);
    bus.processQueue();

    return () => {
      console.log("unregister onRender");
      bus.off("render", onRender);
    };
  }, [bus, ref]);

  return (
    <div ref={ref} className={"react-player-stage"} data-id={Math.random()}>
      {/*{keys(videos).map((src) => {*/}
      {/*  return (*/}
      {/*    <ReactPlayer*/}
      {/*      key={src}*/}
      {/*      ref={videoRefs[src]}*/}
      {/*      url={src}*/}
      {/*      onReady={() => {*/}
      {/*        bus.on("ready", () => {*/}
      {/*          // get parent ref*/}
      {/*        });*/}
      {/*      }}*/}
      {/*      // playing={false}*/}
      {/*      // controls={true}*/}
      {/*      // width={0}*/}
      {/*      // height={0}*/}
      {/*    />*/}
      {/*  );*/}
      {/*})}*/}
      {urls.map((url) => (
        <Portal key={url} containerRef={parentRefs.current[url]}>
          <ReactPlayer
            url={url}
            onReady={() => {
              console.log("onReady");
              // bus.emit("ready", url);
            }}
            playing={false}
            controls={true}
          />
        </Portal>
      ))}
    </div>
  );
};

export const useReactPlayerContext = () => {
  return useContext(ReactPlayerContextInner);
};

class QueuedEventEmitter {
  private queue: any[];
  private listeners: {};
  private processing: boolean;
  id = Math.random();

  constructor() {
    this.listeners = {};
    this.queue = [];
    this.processing = false;
  }

  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event, listener) {
    if (!this.listeners[event]) {
      return;
    }
    console.log(this.id, "off", event, listener);
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  emit(event, ...args) {
    this.queue.push({ event, args });
    this.processQueue();
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    console.log(this.id, "processQueue", this.queue.length);

    while (this.queue.length > 0) {
      const { event, args } = this.queue.shift();
      const listeners = this.listeners[event] || [];
      console.log(this.id, "process", event, args, listeners);
      let processed = 0;
      for (const listener of listeners) {
        console.log(this.id, "emit", event, args);
        listener(...args);
        processed++;
      }

      if (!processed) {
        this.queue.push({ event, args });
        break;
      }
    }

    this.processing = false;
  }
}
