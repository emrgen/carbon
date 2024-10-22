import { useToast } from "@chakra-ui/react";
import { getAuth, signOut } from "@firebase/auth";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { userState } from "../../pages/atom";

export const useLogout = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [ , setUser ] = useRecoilState(userState);

  return useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setUser({ id: "", email: "", username: "" });
        navigate("/");
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        setUser({ id: "", email: "", username: "" });
        navigate("/");
      });
  }, [ navigate, setUser, toast ]);
};
