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
