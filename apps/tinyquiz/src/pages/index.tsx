import { useSidebarActiveKey } from "../hooks/useActiveKey";
import { Layout } from "../components/Layout/index";
import { LayoutContent } from "../components/Layout/LayoutContent/index";
import { Route, Routes } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import { AppSidebar } from "./Sidebar";
import "./pages.styl";

export function Main() {
  const activeKey = useSidebarActiveKey();

  return (
    <Layout sidebar={<AppSidebar activeKey={activeKey} />}>
      <LayoutContent>
        <Routes>
          {/*<Route path="/posts" element={<LazyPosts />} />*/}

          {/*dashboard*/}
          <Route path="/" element={<Box />} />

          {/*users*/}
          {/*<Route path="/member" element={<Members />} />*/}
          {/*<Route path="/account" element={<LazyAccount />} />*/}

          {/*<Route path="/settings" element={<Settings />} />*/}
        </Routes>
      </LayoutContent>
    </Layout>
  );
}
