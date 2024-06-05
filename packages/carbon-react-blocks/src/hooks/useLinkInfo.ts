import { useEffect, useState } from "react";
import { BookmarkInfo } from "@emrgen/carbon-blocks";
import { Node } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";

export const useLinkInfo = (
  node: Node,
  linkPath: string,
  linkInfoPath: string,
) => {
  const app = useCarbon();
  const bookmark = node.props.get(linkInfoPath, {} as BookmarkInfo);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    const src = node.props.get(linkPath, "");
    const info = node.props.get(linkInfoPath, {} as BookmarkInfo);

    console.log("useLinkInfo", src, info.link, node.id.toString());
    if (loaded || info.link === src || src === "") {
      setLoading(false);
      return;
    }

    if (src === "") {
      console.error("No src", node.id.toString());
      app.cmd.Update(node, {
        [linkInfoPath]: {},
      });
      setLoading(false);
      return;
    }

    fetch(`https://api.microlink.io?url=${src}`)
      .then((res) => {
        res.json().then((r) => {
          const { data } = r;
          const { title, description, url, image, logo } = data;
          app.cmd
            .Update(node, {
              [linkInfoPath]: {
                title,
                description,
                link: url,
                image,
                logo,
              },
            })
            .Dispatch();
          setLoading(false);
          setLoaded(true);
        });
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [app, linkInfoPath, linkPath, node]);

  return { loading, bookmark };
};
