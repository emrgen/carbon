import {atom} from "recoil";

export const userState = atom<{
  id?: string;
  uid?: string;
  username?: string;
  email?: string;
  role?: { id?: string; name?: string, type?: string };
}>({
  key: "user",
  default: {},
});
