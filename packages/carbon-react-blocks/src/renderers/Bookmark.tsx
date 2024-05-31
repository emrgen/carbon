import { CarbonBlock, RendererProps, useCarbon } from "@emrgen/carbon-react";
import { useEffect, useState } from "react";
import { BookmarkPath } from "@emrgen/carbon-core";

const BookmarkInfoPath = "local/state/bookmark/info";

interface BookmarkInfo {
  title?: string;
  description?: string;
  link?: string;
  image?: {
    url: string;
    type: string;
  };
  logo?: {
    url: string;
    type: string;
  };
}

export const BookmarkComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const bookmark = node.props.get(BookmarkInfoPath, {} as BookmarkInfo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const src = node.props.get(BookmarkPath, "");
    const info = node.props.get(BookmarkInfoPath, {} as BookmarkInfo);

    if (info.link === src) {
      console.error("Already fetched", node.id.toString());
      setLoading(false);
      return;
    }

    if (src === "") {
      console.error("No src", node.id.toString());
      app.cmd.Update(node, {
        [BookmarkInfoPath]: {},
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
              [BookmarkInfoPath]: {
                title,
                description,
                link: url,
                image,
                logo,
              },
            })
            .Dispatch();
          setLoading(false);
        });
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [app, node]);

  return (
    <CarbonBlock node={node}>
      <div className={"bookmark-content"}>
        <div className={"bookmark-title"}>{bookmark.title ?? "Loading..."}</div>
        <div className={"bookmark-description"}>
          {bookmark.description ?? "\u200B"}
        </div>
        <div className={"bookmark-source"}>
          <div className={"bookmark-fabicon"}>
            {bookmark.logo?.url && (
              <img src={bookmark.logo?.url} alt={bookmark.title ?? "\u200B"} />
            )}
          </div>
          <div className={"bookmark-src"}>{bookmark.link ?? "\u200B"}</div>
        </div>
      </div>
      <div className={"bookmark-image"}>
        <div className={"bookmark-image-wrapper"}>
          {bookmark.image?.url && (
            <img src={bookmark.image?.url} alt={bookmark.title} />
          )}
        </div>
      </div>
    </CarbonBlock>
  );
};
