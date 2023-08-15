import React from "react"
import { PiTextAaBold, PiTextHFourBold, PiTextHOneBold, PiTextHThreeBold, PiTextHTwoBold } from "react-icons/pi"
import { TbListNumbers } from "react-icons/tb"
import { PiListBulletsBold } from "react-icons/pi"
import { FcTodoList } from "react-icons/fc"
import { IoToggleOutline } from "react-icons/io5"
import { MdFormatQuote } from "react-icons/md"
import { TbSection } from "react-icons/tb"
import { AiOutlinePicture } from "react-icons/ai"
import { RxVideo } from "react-icons/rx"
import { VscListSelection } from "react-icons/vsc"
import { TbMathXDivideY2 } from "react-icons/tb"

export const blockIcons = {
  section: <PiTextAaBold />,
  collapsible: <IoToggleOutline />,
  numberedList: <TbListNumbers />,
  bulletedList: <PiListBulletsBold />,
  todo: <FcTodoList />,
  h1: <PiTextHOneBold />,
  h2: <PiTextHTwoBold />,
  h3: <PiTextHThreeBold />,
  h4: <PiTextHFourBold />,
  quote: <MdFormatQuote />,
  callout: <TbSection />,
  image: <AiOutlinePicture />,
  video: <RxVideo />,
  content: <VscListSelection />,
  equation: <TbMathXDivideY2 />,
};
