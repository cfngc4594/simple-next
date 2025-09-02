import { hydrateRoot } from "react-dom/client";

// 客户端也需要路由逻辑来加载正确的组件
async function renderApp() {
  const pathname = window.location.pathname;

  const pagePath =
    pathname === "/"
      ? "./src/pages/index.tsx"
      : (await import(`./src/pages${pathname}.tsx`).catch(() => null))
      ? `./src/pages${pathname}.tsx`
      : `./src/pages${pathname}/index.tsx`;

  // 动态导入与服务端匹配的组件
  const pageModule = await import(pagePath);
  const PageComponent = pageModule.default;

  const container = document.getElementById("app");
  const ssrPropsElement = document.getElementById("__SSR_PROPS__");
  const ssrProps = ssrPropsElement
    ? JSON.parse(ssrPropsElement.textContent || "{}")
    : {};

  if (container) {
    hydrateRoot(container, <PageComponent {...ssrProps} />);
  }
}

renderApp();
