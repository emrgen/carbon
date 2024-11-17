import { useRef } from "react";

// init({ data });

// console.log(Data);

export const EmojiPicker = () => {
  return (
    <div className={"carbon-emoji-picker"}>
      <EmojiSearch />
      <EmojiList />
    </div>
  );
};

const EmojiList = () => {
  return <div className={"emoji-list"}></div>;
};

const EmojiSearch = () => {
  const ref = useRef(null);

  console.log(ref);

  return (
    <div className={"emoji-search"}>
      {/*<input className={"emoji-search-input"} />*/}
    </div>
  );
};