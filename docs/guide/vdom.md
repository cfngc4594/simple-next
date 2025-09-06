# 虚拟 DOM

首先，让我们了解 React 如何将 HTML 结构转换为虚拟 DOM。

假设我们编写了这样一段 JSX：

```jsx
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
```

其中的 JSX 代码会被 Babel 或 SWC 等工具编译为 `React.createElement` 函数调用，例如：

```jsx
const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
);
```

可以看到，`createElement` 接收的第一个参数是 `type`，表示元素的标签类型；第二个参数是 `props`，表示元素的属性；从第三个参数开始是当前元素的子元素，即 `children`。

我们可以尝试自己实现一个类似的 `createElement` 函数。它需要接收 `type`、`props` 和 `children`（使用剩余参数语法收集所有子元素）：

```js
const React = {
  createElement(type, props, ...children) {},
};
```

该函数最终返回一个对象，包含 `type` 和 `props`。我们将传入的 `props` 展开，并将 `children` 也放入 `props` 对象中：

```js
const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children,
      },
    };
  },
};
```

注意，在类似 `React.createElement("a", null, "bar")` 的调用中，第三个参数是一个文本节点，没有额外的属性。为了统一处理，我们需要为文本节点创建一种特定的结构，使其与普通元素节点保持一致，便于后续遍历。

我们定义一个 `createTextElement` 方法，用于创建文本节点。文本节点的 `type` 设为固定的 `"TEXT_ELEMENT"`，同时将其文本内容放在 `props.nodeValue` 中，以符合 `document.createTextNode()` 的用法：

```js
const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children,
      },
    };
  },
  createTextElement(text) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
        children: [],
      },
    };
  },
};
```

现在，我们需要在 `createElement` 中对 `children` 数组进行遍历处理。使用 `map` 方法，判断每个子项是否为对象：如果是，说明是元素节点，直接保留；否则，将其转换为文本节点：

```js
const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map((child) => {
          if (typeof child === "object") {
            return child;
          } else {
            return React.createTextElement(child);
          }
        }),
      },
    };
  },
  createTextElement(text) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
        children: [],
      },
    };
  },
};
```

我们可以通过以下代码测试虚拟 DOM 的构建结果：

```js
const vdom = React.createElement(
  "div",
  { id: 1 },
  React.createElement("span", null, "genshin impact")
);

console.log(JSON.stringify(vdom, null, 2));
```

输出如下结构，说明虚拟 DOM 构建成功：

```json
{
  "type": "div",
  "props": {
    "id": 1,
    "children": [
      {
        "type": "span",
        "props": {
          "children": [
            {
              "type": "TEXT_ELEMENT",
              "props": {
                "nodeValue": "genshin impact",
                "children": []
              }
            }
          ]
        }
      }
    ]
  }
}
```

至此，我们完成了虚拟 DOM 的构建。后续还可以继续实现虚拟 DOM 到 Fiber 结构的转换，以及引入时间切片机制以优化渲染性能。
