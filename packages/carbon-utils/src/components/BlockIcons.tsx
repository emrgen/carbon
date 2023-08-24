import { AiOutlinePicture } from "react-icons/ai"
import { BsCodeSquare } from "react-icons/bs"
import { FcTodoList } from "react-icons/fc"
import { IoToggleOutline } from "react-icons/io5"
import { LuFrame } from "react-icons/lu"
import { MdFormatQuote } from "react-icons/md"
import { PiListBulletsBold, PiTextAaBold, PiTextHFourBold, PiTextHOneBold, PiTextHThreeBold, PiTextHTwoBold } from "react-icons/pi"
import { RxVideo } from "react-icons/rx"
import { TbListNumbers, TbMathXDivideY2, TbSection } from "react-icons/tb"
import { VscListSelection } from "react-icons/vsc"

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
  code: <BsCodeSquare />,
  frame: <LuFrame />,
};
