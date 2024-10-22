import { Box } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { userState } from "@/pages/atom.ts";
import { useCallback, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "@firebase/auth";
import { ContentLoader } from "@/components/ContentLoader";
import { Route, Routes } from "react-router-dom";
import { LazyLogin } from "@/pages/Login/LazyLogin.tsx";
import { LazyRegister } from "@/pages/Register/LazyRegister.tsx";
import { LazyMain } from "@/pages/LazyMain.tsx";
import { LazyLanding } from "@/pages/Landing/LaztLanding.tsx";
import { toServiceUrl } from "@/service_url.ts";
import { User } from "@/types.ts";
import axios from "axios";
import "./App.styl";
import {useFirebase} from "./hooks/userFirebase";

export default function App() {
  useFirebase();
  const [ user, setUser ] = useRecoilState(userState);
  const [ isLoading, setIsLoading ] = useState(true);

  const createUser = useCallback(async(user: User) => {
    return axios({
      method: "POST",
      url: toServiceUrl("user"),
      data: user,
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setUser({
        id: user?.uid || "",
        uid: user?.uid || "",
        email: user?.email || "",
        username: user?.displayName || "",
      });

      user?.getIdToken().then((token) => {
        localStorage.setItem("token", token);
      });

      setIsLoading(false);
    });
  }, [ setUser, createUser ]);

  useEffect(() => {
    if (!user.uid) {
      return;
    }
    // save user to the database if it doesn't exist
    createUser({
      id: undefined!,
      external_id: user?.uid || "",
      email: user?.email || "",
      name: user?.username || "",
    }).then((r) => {
      console.log("user created", r.data);
    });
  }, [ user ]);

  return (
    <Box h="full" w="full" pos={"absolute"} overflow={"hidden"}>
      <ContentLoader isLoading={isLoading}>
        <Routes>
          <Route path="/login" element={<LazyLogin />} />
          <Route path="/register" element={<LazyRegister />} />
          {/* if user is logged in render the application*/}
          <Route path="*" element={user.id ? <LazyMain /> : <LazyLanding />} />
        </Routes>
      </ContentLoader>
    </Box>
  );
}
