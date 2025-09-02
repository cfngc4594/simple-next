# 服务端渲染 (SSR)

## 应用渲染示例

以下是一个使用 React 实现 SSR 的简单示例：

1. 创建新文件夹并进入：

   ```shell
   mkdir ssr-app && cd ssr-app
   ```

2. 初始化项目：

   ```shell
   bun init -y
   ```

3. 安装依赖：

   ```shell
   bun add react react-dom
   bun add -D @types/react @types/react-dom
   ```

4. 将 `index.ts` 重命名为 `index.tsx`，并更新 `package.json` 中的 `"module"` 字段为 `"index.tsx"`，然后添加以下内容：

```tsx
import { useState } from "react";
import { renderToString } from "react-dom/server";

function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

const appHtml = renderToString(<App />);
console.log(appHtml);
```

运行程序：

```shell
bun run index.tsx
```

终端将输出：

```html
<button>0</button>
```

`renderToString()` 方法接收一个 `ReactNode` 参数并返回对应的 HTML 字符串。

接下来，我们将集成 Bun 的内置服务器来创建 Web 服务，并将 HTML 片段包装为完整的页面：

```tsx
import { useState } from "react";
import { renderToString } from "react-dom/server";

function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

Bun.serve({
  port: 3000,
  async fetch() {
    const appHtml = renderToString(<App />);

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>React SSR with Bun</title>
      </head>
      <body>
        <div id="app">${appHtml}</div>
      </body>
    </html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log("服务器运行中：http://localhost:3000");
```

执行 `bun run index.tsx` 并访问 `http://localhost:3000`，即可在页面中看到按钮。

## 客户端激活

此时点击按钮并不会触发数字变化，因为页面仍然是静态的。要使客户端具备交互能力，React 需要执行**激活**步骤：创建与服务端相同的应用实例，匹配组件与 DOM 节点，并添加事件监听器。

为实现此功能，需要在浏览器中加载包含 React 和组件逻辑的 JavaScript 代码。

首先，为提升代码清晰度并支持服务端与客户端共享组件，将 `App` 组件拆分至 `src` 目录：

创建 `src/App.tsx`：

```tsx
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

创建客户端入口文件 `client.tsx`：

```tsx
import { hydrateRoot } from "react-dom/client";
import App from "./src/App";

const container = document.getElementById("app");
if (container) {
  hydrateRoot(container, <App />);
}
```

此处使用 `hydrateRoot` 而非 `createRoot().render()`，它不会重新创建 DOM 节点，而是在现有 HTML 结构上附加事件监听器和交互逻辑。

若出现 TypeScript 错误：

```
找不到名称“document”。是否需要更改目标库? 请尝试更改 “lib” 编译器选项以包括 “dom”。ts(2584)
```

请将 `tsconfig.json` 中的 `"lib": ["ESNext"]` 修改为：

```json
"lib": ["ESNext", "DOM", "DOM.Iterable"]
```

更新主入口文件 `index.tsx`，导入 `App` 组件并在 HTML 中包含客户端脚本：

```tsx
import { renderToString } from "react-dom/server";
import App from "./src/App";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

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

    if (url.pathname === "/") {
      const appHtml = renderToString(<App />);

      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>React SSR with Bun</title>
          <meta charset="UTF-8" />
        </head>
        <body>
          <div id="app">${appHtml}</div>
          <script src="/client.js" defer></script>
        </body>
      </html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log("服务器运行中：http://localhost:3000");
```

项目结构如下：

```
.
├── bun.lock
├── client.tsx
├── index.tsx
├── package.json
├── README.md
├── src
│   └── App.tsx
└── tsconfig.json
```

重新启动服务器：

```shell
bun run index.tsx
```

访问 `http://localhost:3000`，现在点击按钮即可看到数字递增。

## 完整流程说明

1. 访问 `http://localhost:3000` 时，Bun 服务器执行 `index.tsx`
2. `renderToString(<App />)` 将组件渲染为字符串 `<button>0</button>`
3. 服务器返回包含按钮字符串和 `<script src="/client.js">` 标签的完整 HTML 页面
4. 浏览器解析并显示静态按钮
5. 浏览器请求 `/client.js` 脚本
6. Bun 服务器使用 `Bun.build` 打包 `client.tsx` 及其依赖
7. 返回可在浏览器中运行的 JS 文件
8. 浏览器执行 JS 文件，`hydrateRoot` 将 React 交互逻辑附加到现有 HTML
9. 客户端激活完成，静态页面转变为完全可交互的 React 应用
