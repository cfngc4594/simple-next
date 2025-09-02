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
