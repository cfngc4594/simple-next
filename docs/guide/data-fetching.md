# 数据获取

## 动态数据渲染

之前的示例渲染的都是静态内容。如果希望根据不同用户渲染个性化内容，可以在服务端获取数据，并通过 `props` 将数据传递给组件。

我们参考 Next.js 的页面路由设计，在 `src/App.tsx` 中导出一个 `getServerSideProps` 方法用于数据获取。以下示例使用 fakerapi 生成名为 `initialCount` 的随机整数作为 count 的初始值：

```tsx
import { useState } from "react";

export const getServerSideProps = async () => {
  const request = await fetch(
    "https://fakerapi.it/api/v1/custom?_quantity=1&initialCount=number"
  );
  const response = await request.json();
  const initialCount = response.data[0].initialCount;
  return { props: { initialCount } };
};

export default function App({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState<number>(initialCount);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

定义并导出 `getServerSideProps` 后，我们需要在服务端每次请求页面时调用此方法，获取数据后通过 props 传递给 App 组件：

```tsx
if (url.pathname === "/") {
  const pageProps = await getServerSideProps();
  const appHtml = renderToString(<App {...pageProps.props} />);

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
```

但此时 `client.tsx` 中的 App 组件同样需要 `initialCount` 属性。为确保客户端和服务端数据一致，我们可以将服务端获取的数据嵌入页面中：

```html
<script id="__SSR_PROPS__" type="application/json">
  ${JSON.stringify(pageProps.props)}
</script>
```

然后在 `client.tsx` 中读取这些数据并传递给 App 组件：

```tsx
import { hydrateRoot } from "react-dom/client";
import App from "./src/App";

const container = document.getElementById("app");
const ssrPropsElement = document.getElementById("__SSR_PROPS__");
const ssrProps = ssrPropsElement
  ? JSON.parse(ssrPropsElement.textContent || "{}")
  : {};

if (container) {
  hydrateRoot(container, <App {...ssrProps} />);
}
```

## 完整代码实现

**index.tsx**

```tsx
import { renderToString } from "react-dom/server";
import App, { getServerSideProps } from "./src/App";

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
      const pageProps = await getServerSideProps();
      const appHtml = renderToString(<App {...pageProps.props} />);

      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>React SSR with Bun</title>
          <meta charset="UTF-8" />
        </head>
        <body>
          <div id="app">${appHtml}</div>
          <script id="__SSR_PROPS__" type="application/json">${JSON.stringify(
            pageProps.props
          )}</script>
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

**client.tsx**

```tsx
import { hydrateRoot } from "react-dom/client";
import App from "./src/App";

const container = document.getElementById("app");
const ssrPropsElement = document.getElementById("__SSR_PROPS__");
const ssrProps = ssrPropsElement
  ? JSON.parse(ssrPropsElement.textContent || "{}")
  : {};

if (container) {
  hydrateRoot(container, <App {...ssrProps} />);
}
```

**src/App.tsx**

```tsx
import { useState } from "react";

export const getServerSideProps = async () => {
  const request = await fetch(
    "https://fakerapi.it/api/v1/custom?_quantity=1&initialCount=number"
  );
  const response = await request.json();
  const initialCount = response.data[0].initialCount;
  return { props: { initialCount } };
};

export default function App({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState<number>(initialCount);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```
