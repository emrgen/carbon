import {SidebarItem} from "./SidebarItem";
import {useNavigate} from "react-router-dom";
import {useRecoilState} from "recoil";
import {userState} from "@/pages/atom.ts";
import {BiUser} from "react-icons/bi";

export function SidebarUserProfile() {
  const navigate = useNavigate();
  const [user] = useRecoilState(userState);

  return (
      <SidebarItem
        pathPrefix={"/account"}
        tooltip={"Account"}
        label={'Account'}
        icon={<BiUser/>}
      />
  );
}
