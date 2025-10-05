# Babel

Babel 是一个 JS 编译器，提供了 JS 的编译链路，可以将源代码转成目标代码。

## 使用

Babel 的使用非常简单，只需要安装对应的包：

```bash
bun add -D @babel/core @babel/cli @babel/preset-env
```

babel 的示例代码位于 `modules/babel` 目录下。

## 功能

Babel 主要有如下功能：

1. 语法转换：将新版本的 JS 语法转换为旧版本的语法（例如 ES6 转 ES5）
2. Polyfill：通过引入额外的代码，解决新版本 JS 特性在旧版本浏览器中不支持的问题（例如 Promise）
3. JSX/TSX：将 JSX/TSX 语法转换为 JS 语法

浏览器只支持 HTML、CSS 和 JS， 并不支持 JSX/TSX 语法，因此需要一个工具转成对应的 JS 语法，才能被浏览器识别。

这个工具就可以通过 Babel 或者 SWC 等工具来实现。

### 1. 语法转换

test.js 文件中包含了一些 ES6+ 的语法：

```js
const A = (params = 0) => params + 1;

const B = [...A, 2, 3];

class C {}

new C();
```

index.js 通过 Babel 将 test.js 转换为 ES5 语法：

```js
import babel from "@babel/core";
import presetEnv from "@babel/preset-env"; // es6 - es5
import fs from "node:fs";

// 通过 utf-8 编码读取 test.js 文件内容
const code = fs.readFileSync("./modules/babel/test.js", "utf-8");
// 使用 Babel 转换代码
const result = babel.transform(code, {
  // 使用 preset-env 预设
  presets: [presetEnv],
});
// 输出转换后的代码
console.log(result.code);
```

运行 index.js：

```bash
bun run modules/babel/index.js
```

便可以看到转换后的 ES5 代码，如此便实现了 ES6 转 ES5

### 2. Polyfill

新特性主要通过引入 core-js 实现的，原理如下：

以 filter 为例，会通过 'filter' in Array.prototype 判断当前浏览器的 Array 的原型链上是否有 filter 方法，如果有则什么都不做，如果没有则写入一个 filter 方法。

## 3. JSX

想要支持 JSX，只需要额外安装一个预设即可：

```bash
bun add -D @babel/preset-react
```

然后将 test.js 改成 test.jsx：

```jsx
const A = (params = 0) => params + 1;

const B = [...A, 2, 3];

class C {}

new C();

function App() {
  return <div>{B}</div>;
}
```

最后在 index.js 中添加对 preset-react 的引用：

```js
import babel from "@babel/core";
import presetEnv from "@babel/preset-env"; // es6 - es5
import react from "@babel/preset-react"; // jsx/tsx
import fs from "node:fs";

// 通过 utf-8 编码读取 test.jsx 文件内容
const code = fs.readFileSync("./modules/babel/test.jsx", "utf-8");
// 使用 Babel 转换代码
const result = babel.transform(code, {
  // 使用 preset-env 预设
  presets: [presetEnv, react],
});
// 输出转换后的代码
console.log(result.code);
```

运行 index.js：

```bash
bun run modules/babel/index.js
```

便可以发现 jsx 部分 通过 babel 转换，变成了：

```js
function App() {
  return /*#__PURE__*/ React.createElement("div", null, B);
}
```

可以看到，JSX 语法被转换成了 `React.createElement` 的调用。

因此我们可以将 JSX 语法理解为 `React.createElement` 的语法糖。
