import { ReactRenderer } from "@emrgen/carbon-react";
import { LayoutContent } from "./plugin/LayoutContent";
import { Sidebar } from "./plugin/Sidebar";
import { SidebarLayout } from "./plugin/SidebarLayout";
import { LayoutContentComp } from "./renderer/LayoutContent";
import { SidebarComp } from "./renderer/Sidebar";
import { SidebarLayoutComp } from "./renderer/SidebarLayout";

import "./layout.styl";

export const CarbonUI = {
  plugins: [new SidebarLayout(), new Sidebar(), new LayoutContent()],
  renderers: [
    ReactRenderer.create("sidebarLayout", SidebarLayoutComp),
    ReactRenderer.create("sidebar", SidebarComp),
    ReactRenderer.create("layoutContent", LayoutContentComp),
  ],
};