import { Box } from "@chakra-ui/react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout/index";
import { LayoutContent } from "../components/Layout/LayoutContent/index";
import { useSidebarActiveKey } from "../hooks/useActiveKey";
import TinyQuiz from "../TinyQuiz/TinyQuiz";
import { AppSidebar } from "./Sidebar";
import "./pages.styl";

export function Main() {
  const activeKey = useSidebarActiveKey();

  return (
    <Layout sidebar={<AppSidebar activeKey={activeKey} />}>
      <LayoutContent>
        <Routes>
          {/* dashboard*/}
          <Route path="/" element={<Box />} />

          <Route path="/app" element={<TinyQuiz />} />

          {/* <Route path="/settings" element={<Settings />} />*/}
        </Routes>
      </LayoutContent>
    </Layout>
  );
}
