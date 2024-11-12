import { CarbonBlock, RendererProps, useCarbon } from "@emrgen/carbon-react";
import { useLinkInfo } from "../hooks/useLinkInfo";
import { BookmarkInfoPath, BookmarkPath } from "@emrgen/carbon-blocks";

export const BookmarkComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const { loading, bookmark } = useLinkInfo(
    node,
    BookmarkPath,
    BookmarkInfoPath,
  );

  return (
    <CarbonBlock node={node}>
      <a
        href={bookmark.link}
        className={"bookmark-wrapper"}
        target={"_blank"}
        rel="noreferrer"
      >
        <div className={"bookmark-content"}>
          <div className={"bookmark-title"}>
            {bookmark.title ?? "Loading..."}
          </div>
          <div className={"bookmark-description"}>
            {bookmark.description ?? "\u200B"}
          </div>
          <div className={"bookmark-source"}>
            <div className={"bookmark-fabicon"}>
              {bookmark.logo?.url && (
                <img
                  src={bookmark.logo?.url}
                  alt={bookmark.title ?? "\u200B"}
                />
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
      </a>
    </CarbonBlock>
  );
};
