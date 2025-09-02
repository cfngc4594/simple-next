import { renderToString } from "react-dom/server";
import App from "./src/App";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 如果是请求客户端脚本
    if (url.pathname === "/client.js") {
      // 使用 Bun 的打包器实时打包客户端代码
      const build = await Bun.build({
        entrypoints: ["./client.tsx"],
        target: "browser",
        minify: true,
      });

      // 返回打包后的 JS 文件
      return new Response(build.outputs[0], {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // 如果是请求页面
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
      </html>
    `;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // 处理其他请求
    return new Response("Not Found", { status: 404 });
  },
});

console.log("服务器正在运行，请访问 http://localhost:3000");
