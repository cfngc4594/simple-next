import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Simple Next",
  description: "基于 Bun 运行时的最小化 React 服务端渲染示例",
  base: "/simple-next/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "指南", link: "/guide/" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "服务端渲染 (SSR)", link: "/guide/" },
            { text: "数据获取", link: "/guide/data-fetching" },
            { text: "路由", link: "/guide/routing" },
            { text: "虚拟DOM", link: "/guide/vdom" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/cfngc4594/simple-next" },
    ],
  },
});
