import { RendererProps } from "@emrgen/carbon-react";
import React from "react";

export function Tags(props: RendererProps) {
  const { node, value } = props;
  return (
    <div className="carbon-attrs">
      <div className="carbon-attrs-name">
        <span className="carbon-attrs-name-label"> &nbsp;#&nbsp; Tags</span>
      </div>
      <div className="carbon-attrs-values">
        {value.map((tag) => (
          <div key={tag} className="carbon-tag-attr">
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
