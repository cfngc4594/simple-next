# 路由

构建完整的 Web 应用时，单一页面往往无法满足需求。我们需要一种机制将不同 URL 路径映射到对应的页面组件。为此，我们将借鉴 Next.js `pages` 目录的文件系统路由约定，实现一套基于文件系统的路由系统。

## 静态路由

我们首先尝试实现静态路由，例如：

- `src/pages/index.tsx` → `/`
- `src/pages/about.tsx` → `/about`
- `src/pages/posts/first.tsx` → `/posts/first`

我们需要修改服务端和客户端的入口文件，使其能够根据 URL 动态加载对应的页面组件，而不是硬编码只加载 `App` 组件。

### 第一步：调整项目结构

1. 创建 `pages` 目录用于存放页面组件：

```shell
mkdir -p src/pages
```

2. 在 `src/pages` 下创建 `index.tsx`：

```tsx
export default function HomePage() {
  return <main>Home Page</main>;
}
```

3. 创建“关于”页面 `src/pages/about.tsx` 用于演示：

```tsx
export default function AboutPage() {
  return <main>About Page</main>;
}
```

4. 创建 `components` 目录用于存放共享组件，如导航栏：

```shell
mkdir -p src/components
```

5. 在 `components` 目录中添加 `src/components/nav.tsx`，实现导航功能：

```tsx
export default function Nav() {
  return (
    <nav>
      <a href="/">Home</a> | <a href="/about">About</a>
    </nav>
  );
}
```

6. 将 Nav 组件添加到两个页面中：

src/pages/index.tsx：

```tsx
import Nav from "../components/nav";

export default function HomePage() {
  return (
    <main>
      <Nav />
      Home Page
    </main>
  );
}
```

src/pages/about/index.tsx：

```tsx
import Nav from "../../components/nav";

export default function AboutPage() {
  return (
    <main>
      <Nav />
      About Page
    </main>
  );
}
```

### 第二步：修改服务端 `index.tsx`（核心）

我们需要根据请求中的 pathname 动态查找对应文件是否存在，而不是使用硬编码的 if 判断。

例如，当 pathname 为 `/` 时，检查 `src/pages/index.tsx` 是否存在；当 pathname 为 `/about` 时，先检查 `src/pages/about.tsx` 是否存在，再检查 `src/pages/about/index.tsx`（此时 about 文件夹充当路由）。我们定义两种路径：`directPath` 和 `indexPath`，其中 `directPath` 优先级更高。

```tsx
const pathname = url.pathname;
let pagePath = "";

// 1. 定义两种可能的路径
const directPath = `./src/pages${pathname === "/" ? "/index" : pathname}.tsx`;
const indexPath = `./src/pages${pathname}/index.tsx`;

// 2. 按优先级检查文件是否存在
if (existsSync(directPath)) {
  pagePath = directPath;
} else if (existsSync(indexPath)) {
  pagePath = indexPath;
} else {
  // 如果两种路径都找不到，则返回 404
  return new Response("404 Not Found", { status: 404 });
}
```

这样我们就不再固定使用 `renderToString` 渲染 App 组件，而是动态导入当前页面模块并传递参数进行渲染。

```tsx
// 3. 动态导入页面模块
const pageModule = await import(pagePath);
const PageComponent = pageModule.default;
const getServerSideProps = pageModule.getServerSideProps;

// 4. 如果页面有 getServerSideProps，则执行它
let pageProps = { props: {} };
if (typeof getServerSideProps === "function") {
  pageProps = await getServerSideProps();
}

// 5. 渲染页面组件
const appHtml = renderToString(<PageComponent {...pageProps.props} />);

// 6. 生成并返回 HTML
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>React SSR with Routing</title>
      <meta charset="UTF-8" />
    </head>
    <body>
      <div id="app">${appHtml}</div>
      <script id="__SSR_PROPS__" type="application/json">${JSON.stringify(
        pageProps.props
      )}</script>
      <script src="/client.js" defer></script>
    </body>
  </html>
`;
return new Response(html, {
  headers: { "Content-Type": "text/html; charset=utf-8" },
});
```

客户端也需要相应的路由逻辑来加载正确组件。由于客户端无法使用 `existsSync`，我们尝试导入直接路径，若失败（使用 `.catch(() => null)`），则回退到 `index` 路径。

重新运行 `bun run index.tsx` 启动服务器，访问 `http://localhost:3000` 即可通过上方 Nav 组件进行跳转。

最终文件结构如下：

```
.
├── bun.lock
├── client.tsx
├── index.tsx
├── package.json
├── README.md
├── src
│   ├── App.tsx # 可删除
│   ├── components
│   │   └── nav.tsx
│   └── pages
│       ├── about
│       │   └── index.tsx
│       └── index.tsx
└── tsconfig.json
```

index.tsx：

```tsx
import { existsSync } from "fs";
import { renderToString } from "react-dom/server";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // client.js 打包逻辑保持不变
    if (url.pathname === "/client.js") {
      const build = await Bun.build({
        entrypoints: ["./client.tsx"],
        target: "browser",
        minify: true,
      });
      return new Response(build.outputs[0], {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // 实现文件路由
    try {
      const pathname = url.pathname;
      let pagePath = "";

      // 1. 定义两种可能的路径
      const directPath = `./src/pages${
        pathname === "/" ? "/index" : pathname
      }.tsx`;
      const indexPath = `./src/pages${pathname}/index.tsx`;

      // 2. 按优先级检查文件是否存在
      if (existsSync(directPath)) {
        pagePath = directPath;
      } else if (existsSync(indexPath)) {
        pagePath = indexPath;
      } else {
        // 如果两种路径都找不到，则返回 404
        return new Response("404 Not Found", { status: 404 });
      }

      // 3. 动态导入页面模块
      const pageModule = await import(pagePath);
      const PageComponent = pageModule.default;
      const getServerSideProps = pageModule.getServerSideProps;

      // 4. 如果页面有 getServerSideProps，则执行它
      let pageProps = { props: {} };
      if (typeof getServerSideProps === "function") {
        pageProps = await getServerSideProps();
      }

      // 5. 渲染页面组件
      const appHtml = renderToString(<PageComponent {...pageProps.props} />);

      // 6. 生成并返回 HTML
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>React SSR with Routing</title>
            <meta charset="UTF-8" />
          </head>
          <body>
            <div id="app">${appHtml}</div>
            <script id="__SSR_PROPS__" type="application/json">${JSON.stringify(
              pageProps.props
            )}</script>
            <script src="/client.js" defer></script>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (error) {
      console.error(error);
      return new Response("500 Internal Server Error", { status: 500 });
    }
  },
});

console.log("服务器正在运行，请访问 http://localhost:3000");
```

client.tsx：

```tsx
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
```

src/components/nav.tsx：

```tsx
export default function Nav() {
  return (
    <nav>
      <a href="/">Home</a> | <a href="/about">About</a>
    </nav>
  );
}
```

src/pages/index.tsx：

```tsx
import Nav from "../components/nav";

export default function HomePage() {
  return (
    <main>
      <Nav />
      Home Page
    </main>
  );
}
```

src/pages/about/index.tsx：

```tsx
import Nav from "../../components/nav";

export default function AboutPage() {
  return (
    <main>
      <Nav />
      About Page
    </main>
  );
}
```
