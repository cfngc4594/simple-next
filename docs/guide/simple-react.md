# Simple React

全文参考自：https://pomb.us/build-your-own-reacto/

## createElement

这是一段简单的 React 代码：

```jsx
import React from "react";
const element = (
  <div className="container">
    <h1>Simple React</h1>
    <p>Year: {2025}</p>
  </div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

如果我们想要实现一个 Simple React，就需要去掉 React 特有的代码并替换为原始的 Javascript。

首先代码中用到了 jsx 语法，我们需要转换为原声的 Javascript 语法，我们可以直接使用一个叫做 Babel 的工具完成转换，转换后的代码为：

```js
import React from "react";
const element = React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Simple React"),
  React.createElement("p", null, "Year: ", 2025)
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

而 createElement 函数的定义如下：

```js
createElement(type, props, ...children);
```

因此可以看出转换的过程就是把 HTML 元素替换为了 createElement 函数调用，第一个参数是元素标签，第二个参数是元素属性，第三个参数通过解构获取元素所有的子节点。

因此如果我们想自己实现一个 React，只需要实现 createElement 和 render 两个函数即可。

我们先定义一个名为 SimpleReact 的对象，并在其中定义 createElement 函数，createElement 的参数定义直接参考 React.createElement：

```js
const SimpleReact = {
  createElement(type, props, ...children) {},
};
```

现在的 SimpleReact.createElement 函数只接收了参数，但是并没有实现，我们需要考虑 createElement 函数的返回值是什么？

我们可以直接打印之前的例子：

```js
import React from "react";
const element = React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Simple React"),
  React.createElement("p", null, "Year: ", 2025)
);
console.log(JSON.stringify(element, null, 2));
```

可以看到，打印结果为一个对象：

```js
{
  "type": "div",
  "key": null,
  "props": {
    "className": "container",
    "children": [
      {
        "type": "h1",
        "key": null,
        "props": {
          "children": "Simple React"
        },
        "_owner": null,
        "_store": {}
      },
      {
        "type": "p",
        "key": null,
        "props": {
          "children": [
            "Year: ",
            2025
          ]
        },
        "_owner": null,
        "_store": {}
      }
    ]
  },
  "_owner": null,
  "_store": {}
}
```

并且对象只有两个属性，分别是 type 和 props，然后我们观察函数的参数：

```js
const SimpleReact = {
  createElement(type, props, ...children) {},
};
```

可以看到 type 和 props 都是现成的，我们只需要把 children 也作为 props 的一个属性即可，因此我们可以非常简单的实现 createElement 函数：

```js
const SimpleReact = {
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

但是现在有个问题，还是以之前的例子：

```js
{
  "type": "div",
  "key": null,
  "props": {
    "className": "container",
    "children": [
      {
        "type": "h1",
        "key": null,
        "props": {
          "children": "Simple React"
        },
        "_owner": null,
        "_store": {}
      },
      {
        "type": "p",
        "key": null,
        "props": {
          "children": [
            "Year: ",
            2025
          ]
        },
        "_owner": null,
        "_store": {}
      }
    ]
  },
  "_owner": null,
  "_store": {}
}
```

最外层 div 的 children 数组有两个对象，但它们的 children 中是字符串或数字，而不是对象，此时它们没有 type 和 props 属性，因此并不符合我们之前定义的对象结构，为了简化我们的代码，我们希望所有的 children 都是对象，因此在 createElement 中，需要对 children 进行处理：如果某项是对象保持不变，如果是字符串或数字，则转换为一个新的对象，而要做到这一点，我们只需要自己定义一个函数，例如把它叫做 createTextElement，然后让返回的对象结构和 createElement 保持一致：

```js
const SimpleReact = {
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

type 的命名其实并没有限制，但是 nodeValue 的命名是为了和真实 DOM 操作保持一致，另外需要注意的是，React.createElement 并没有做这一层包装，我们这么做只是为了简化我们的代码。

然后我们修改 createElement 函数中的 children 部分，createElement 的参数中，children 经过结构后是一个数组，因此我们可以直接通过 map 函数进行遍历：

```js
const SimpleReact = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map((child) => {}),
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

而我们只需要判断 child 是不是一个对象即可，如果是对象则直接返回，否则调用 createTextElement 进行转换：

```js
const SimpleReact = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map((child) =>
          typeof child === "object"
            ? child
            : SimpleReact.createTextElement(child)
        ),
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

由此我们便实现了 createElement 函数，打印一下结果：

```js
const element = SimpleReact.createElement(
  "div",
  { className: "container" },
  SimpleReact.createElement("h1", null, "Simple React"),
  SimpleReact.createElement("p", null, "Year: ", 2025)
);
console.log(element);
```

```js
{
  "type": "div",
  "props": {
    "className": "container",
    "children": [
      {
        "type": "h1",
        "props": {
          "children": [
            {
              "type": "TEXT_ELEMENT",
              "props": {
                "nodeValue": "Simple React",
                "children": []
              }
            }
          ]
        }
      },
      {
        "type": "p",
        "props": {
          "children": [
            {
              "type": "TEXT_ELEMENT",
              "props": {
                "nodeValue": "Year: ",
                "children": []
              }
            },
            {
              "type": "TEXT_ELEMENT",
              "props": {
                "nodeValue": 2025,
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

可以看到相比 React.createElement 多了一层 TEXT_ELEMENT 的包装，这也是我们预期的结果，以及少了一些属性，但是这些属性是 React 内部使用的，目前我们并不需要。

## render

如此我们便实现了 createElement 函数，接下来我们实现 render 函数。

首先还是看 render 函数的定义：

```js
render(reactNode, domNode, callback?)
```

我们先不管 callback 参数，然后回顾先前的 React 代码：

```js
import React from "react";
const element = React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Simple React"),
  React.createElement("p", null, "Year: ", 2025)
);
// {
//   "type": "div",
//   "props": {
//     "className": "container",
//     "children": [
//       {
//         "type": "h1",
//         "props": {
//           "children": [
//             {
//               "type": "TEXT_ELEMENT",
//               "props": {
//                 "nodeValue": "Simple React",
//                 "children": []
//               }
//             }
//           ]
//         }
//       },
//       {
//         "type": "p",
//         "props": {
//           "children": [
//             {
//               "type": "TEXT_ELEMENT",
//               "props": {
//                 "nodeValue": "Year: ",
//                 "children": []
//               }
//             },
//             {
//               "type": "TEXT_ELEMENT",
//               "props": {
//                 "nodeValue": 2025,
//                 "children": []
//               }
//             }
//           ]
//         }
//       }
//     ]
//   }
// }
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

很明显，第一个参数 reactNode 对应的就是 element 对象，第二个参数 domNode 对应的就是 container。

因此我们可以先定义一下 render 函数的参数：

```js
const SimpleReact = {
  render(element, container) {},
};
```

除非传入的 reactNode 是类组件，否则 render 通常不会返回内容，因此我们不需要返回任何内容。

我们先只实现向 DOM 添加内容，而要做到这一点其实很简单，我们只需要先根据 element 的类型创建 DOM 节点，然后再将新的节点附加到 container 即可：

```js
const SimpleReact = {
  render(element, container) {
    const dom = document.createElement(element.type);
    container.appendChild(dom);
  },
};
```

对于如下例子而言：

```js
import React from "react";
const element = React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Simple React"),
  React.createElement("p", null, "Year: ", 2025)
);
// {
//   "type": "div",
//   "props": {
//     "className": "container",
//     "children": [
//       {
//         "type": "h1",
//         "props": {
//           "children": [
//             {
//               "type": "TEXT_ELEMENT",
//               "props": {
//                 "nodeValue": "Simple React",
//                 "children": []
//               }
//             }
//           ]
//         }
//       },
//       {
//         "type": "p",
//         "props": {
//           "children": [
//             {
//               "type": "TEXT_ELEMENT",
//               "props": {
//                 "nodeValue": "Year: ",
//                 "children": []
//               }
//             },
//             {
//               "type": "TEXT_ELEMENT",
//               "props": {
//                 "nodeValue": 2025,
//                 "children": []
//               }
//             }
//           ]
//         }
//       }
//     ]
//   }
// }
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

就是创建了一个 type 为 div 的 DOM 节点，然后将该节点附加到了 id 为 root 的 HTML 元素中。

但是就当前的例子而言，我们只添加了 element 本身，但是没有为它的 childen 创建 DOM 节点，因此我们只需要递归的为每个 child 进行 render 即可：

```js
const SimpleReact = {
  render(element, container) {
    const dom = document.createElement(element.type);
    element.props.children.forEach((child) => {
      this.render(child, dom);
    });
    container.appendChild(dom);
  },
};
```

但是需要注意的是，对于我们的自己定义的 TextElement：

```js
{
  type: "TEXT_ELEMENT",
  props: {
  nodeValue: text,
  children: [],
  },
};
```

会执行：

```js
const dom = document.createElement("TEXT_ELEMENT");
```

但是该 type 是我们自己定义的，并不存在这样的 HTML 元素，因此我们需要单独进行处理，如果 type 为 TEXT_ELEMENT 就创建一个文本节点而不是常规节点：

```js
const SimpleReact = {
  render(element, container) {
    const dom =
      element.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(element.type);

    element.props.children.forEach((child) => {
      this.render(child, dom);
    });
    container.appendChild(dom);
  },
};
```

最后还需要将除了 children 以外的 props 添加上：

```js
const SimpleReact = {
  render(element, container) {
    const dom =
      element.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(element.type);

    const isProperty = (key) => key !== "children";
    Object.keys(element.props)
      .filter(isProperty)
      .forEach((name) => {
        dom[name] = element.props[name];
      });

    element.props.children.forEach((child) => {
      this.render(child, dom);
    });
    container.appendChild(dom);
  },
};
```

最终代码如下：

```js
const SimpleReact = {
  createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map((child) =>
          typeof child === "object"
            ? child
            : SimpleReact.createTextElement(child)
        ),
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
  render(element, container) {
    const dom =
      element.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(element.type);

    const isProperty = (key) => key !== "children";
    Object.keys(element.props)
      .filter(isProperty)
      .forEach((name) => {
        dom[name] = element.props[name];
      });

    element.props.children.forEach((child) => {
      this.render(child, dom);
    });
    container.appendChild(dom);
  },
};

const element = SimpleReact.createElement(
  "div",
  { className: "container" },
  SimpleReact.createElement("h1", null, "Simple React"),
  SimpleReact.createElement("p", null, "Year: ", 2025)
);
const container = document.getElementById("root");
SimpleReact.render(element, container);
```

为了便于后续的更加复杂的代码，减少 this 的指向问题，我们可以将每个函数单独抽出来：

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });
  container.appendChild(dom);
}

const SimpleReact = {
  createElement,
  render,
};

const element = SimpleReact.createElement(
  "div",
  { className: "container" },
  SimpleReact.createElement("h1", null, "Simple React"),
  SimpleReact.createElement("p", null, "Year: ", 2025)
);
const container = document.getElementById("root");
SimpleReact.render(element, container);
```

如果想查看是否能正常运行，需要添加 index.html：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Simple React</title>
    <style>
      .container {
        border: 1px solid #000000;
        padding: 16px;
        max-width: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="./index.js" type="module"></script>
  </body>
</html>
```

然后安装 live-server：

```bash
npm init -y
npm install live-server --save-dev
```

然后运行：

```bash
live-server
```

便可以看到页面正常显示了

## workLoop

但是当前 render 函数的递归调用有很大的问题：

```js
function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });
  container.appendChild(dom);
}
```

一旦渲染开始就不会停止，直到渲染完完整的 element 树，但是如果 element 树很大，可能会阻塞主线程很久导致卡顿。

因此我们可以把工作分解为小的单元，完成每个单元后，如果还有其他事情需要做，就让浏览器中断渲染。

因此我们可以设置一个全局变量 `nextUnitOfWork`：

```js
// 下一个要处理的工作单元
let nextUnitOfWork = null;
```

然后我们用 requestIdleCallback 创建一个循环：

```js
// 下一个要处理的工作单元
let nextUnitOfWork = null;

// 工作循环
function workLoop(deadline) {
  // TODO
  requestIdleCallback(workLoop);
}

// 递归调用工作循环函数
requestIdleCallback(workLoop);
```

浏览器会在主线程空闲时自动对 requestIdleCallback 进行回调（React 并不使用 requestIdleCallback）

requestIdleCallback 会提供一个 deadline 对象，它包含一个方法 timeRemaining()，告诉你浏览器在进入下一帧前还剩多少“空闲时间”（毫秒）

因此我们可以通过判断是否在浏览器空闲时间内以实现“可中断的工作循环”：

```js
// 下一个要处理的工作单元
let nextUnitOfWork = null;

// 工作循环
function workLoop(deadline) {
  // 是否应该让出主线程
  let shouldYield = false;
  // 当下一个要处理的工作单元存在时且不应该让出主线程时
  while (nextUnitOfWork && !shouldYield) {
    // TODO
    // 如果时间快用完了，就让出主线程，等浏览器空闲时再继续
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

// 递归调用工作循环函数
requestIdleCallback(workLoop);
```

但是初始化时下一个要处理的工作单元为空，想要开始使用循环，我们需要设置第一个工作单元，然后编写一个 performUnitOfWork 函数，该函数不仅执行当前的下一个工作单元而且会返回新的下一个工作单元：

```js
// 下一个要处理的工作单元
let nextUnitOfWork = null;

// 工作循环
function workLoop(deadline) {
  // 是否应该让出主线程
  let shouldYield = false;
  // 当下一个要处理的工作单元存在时且不应该让出主线程时
  while (nextUnitOfWork && !shouldYield) {
    // 执行当前的下一个工作单元并且返回新的下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 如果时间快用完了，就让出主线程，等浏览器空闲时再继续
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

// 递归调用工作循环函数
requestIdleCallback(workLoop);

// 执行当前的下一个工作单元并且返回新的下一个工作单元
function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
```

可以看到是当 performUnitOfWork 执行完毕后再判断是否还有空余时间，因此如果执行一个工作单元花的时间太久，就会导致阻塞主线程导致页面卡顿。

## Fiber

前面我们提到了 performUnitOfWork 会执行当前的下一个工作单元并且返回新的下一个工作单元，那到底什么是工作单元呢？

为了组织工作单元，我们需要引入一个数据结构：fiber

我们将为每个 React Element 配备一个 fiber，那么每个 fiber 就都是一个工作单元了，例如：

![alt text](/fiber/fiber1.png)

之后我们的 `render` 函数中只需要创建 root fiber 并将其设置为 `nextUnitOfWork`，然后其余工作将在 `performUnitOfWork` 函数中进行，我们将为每个 `fiber` 执行三件事：

1. 将 React Element 添加到 DOM
2. 为 React Element 的子 Element 创建 fiber
3. 选择下一个工作单元

这种数据结构的目标之一是方便查找下一个工作单元，每个 Fiber 都包含指向其第一个子节点、下一个兄弟节点以及父节点的链接：

![alt text](/fiber/fiber2.png)

当我们完成一个 Fiber 的工作时，如果它有子节点，那么它的子 Fiber 将会成为下一个要处理的工作单元。

例如当完成了 div 这个 Fiber 的工作后，下一个工作单元将是它的子 Fiber —— h1。

![alt text](/fiber/fiber3.png)

如果当前 Fiber 没有子节点，那么我们会将“兄弟节点 （sibling）” 作为下一个工作单元。

例如当 p 这个 Fiber 没有子节点，那么在完成它之后，我们会转到它的兄弟 Fiber —— a：

![alt text](/fiber/fiber4.png)

如果当前 Fiber 既没有子节点，也没有兄弟节点，那么我们会“往上找叔叔节点”，也就是父节点的兄弟节点。

例如下图的 a 和 h2 两个 Fiber 之间的关系：

![alt text](/fiber/fiber5.png)

此外，如果父节点也没有兄弟节点，我们会继续沿着父节点链一路往上，直到找到一个带兄弟节点的父节点，或者到达根节点（root）。

一旦到达根节点，就意味着本次渲染的所有工作都已经完成。

现在让我们来实现对应的代码，我们原本的 render 函数如下：

```js
function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });
  container.appendChild(dom);
}
```

但是我们现在要引入 Fiber，因此将原本 render 函数中的内容移到新建的 createDom 函数中，createDom 函数接收一个 fiber 参数并返回创建好的 DOM 节点：

```js
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

function render(element, container) {
  // TODO: set next unit of work
}
```

在 render 函数中，我们将 nextUnitOfWork 设置为 Fiber 树的根节点：

```js
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}
```

然后，当浏览器准备就绪时，它会调用我们的 workLoop 函数，我们就会开始从根节点开始执行工作。

```js
// 下一个要处理的工作单元（即一个 Fiber 节点）
let nextUnitOfWork = null;

// 工作循环
function workLoop(deadline) {
  // 是否应该让出主线程
  let shouldYield = false;
  // 当存在下一个 Fiber 节点并且不需要让出主线程时
  while (nextUnitOfWork && !shouldYield) {
    // 执行当前 Fiber 的工作，并返回下一个要处理的 Fiber
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 如果剩余时间不足，则让出主线程，等待浏览器空闲时继续
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 在浏览器下次空闲时继续执行工作循环
  requestIdleCallback(workLoop);
}

// 启动第一次工作循环
requestIdleCallback(workLoop);

// 执行当前 Fiber 的工作并返回下一个要处理的 Fiber
function performUnitOfWork(fiber) {
  // TODO: 创建对应的 DOM 节点
  // TODO: 创建新的 Fiber
  // TODO: 返回下一个要处理的 Fiber（子 -> 兄弟 -> 父的兄弟）
}
```

首先我们创建一个新的节点，并将它添加到 DOM 中，我们会在 fiber.dom 属性中保存对该 DOM 节点的引用：

```js
function performUnitOfWork(fiber) {
  // 如果当前 Fiber 没有对应的 DOM 节点，就创建一个
  if (!fiber.dom) {
    // createDom 会根据 type 和 props 创建真实 DOM
    fiber.dom = createDom(fiber);
  }
  // 如果当前 Fiber 有父节点，就把它对应的 DOM 挂到父节点的 DOM 上
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // TODO: 为子元素创建新的 Fiber 节点
  // TODO: 返回下一个要处理的 Fiber（子 -> 兄弟 -> 父的兄弟）
}
```

接着，我们为每个子元素创建一个新的 Fiber：

```js
function performUnitOfWork(fiber) {
  // 如果当前 Fiber 没有对应的 DOM 节点，就创建一个
  if (!fiber.dom) {
    // createDom 会根据 type 和 props 创建真实 DOM
    fiber.dom = createDom(fiber);
  }
  // 如果当前 Fiber 有父节点，就把它对应的 DOM 挂到父节点的 DOM 上
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // 处理当前 Fiber 的子元素，准备为每个子元素创建 Fiber
  const elements = fiber.props.children; // 获取子元素数组
  let index = 0; // index 用于遍历子元素数组
  let prevSibling = null; // 用于记录前一个子 Fiber

  while (index < elements.length) {
    const element = elements[index]; // 当前子元素
    const newFiber = {
      type: element.type, // 元素类型，例如 'div', 'p', 'h1'
      props: element.props, // 元素属性
      parent: fiber, // 父 Fiber 指向当前 Fiber
      dom: null, // 新创建的 Fiber 还没有 DOM 节点
    };
  }
  // TODO: 返回下一个要处理的 Fiber（子 -> 兄弟 -> 父的兄弟）
}
```

然后，我们将它添加到 Fiber 树中，根据它是否是第一个子节点，将其设置为父 Fiber 的子节点或前一个兄弟节点的兄弟节点。

```js
function performUnitOfWork(fiber) {
  // 如果当前 Fiber 没有对应的 DOM 节点，就创建一个
  if (!fiber.dom) {
    // createDom 会根据 type 和 props 创建真实 DOM
    fiber.dom = createDom(fiber);
  }
  // 如果当前 Fiber 有父节点，就把它对应的 DOM 挂到父节点的 DOM 上
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // 处理当前 Fiber 的子元素，准备为每个子元素创建 Fiber
  const elements = fiber.props.children; // 获取子元素数组
  let index = 0; // index 用于遍历子元素数组
  let prevSibling = null; // 用于记录前一个子 Fiber

  while (index < elements.length) {
    const element = elements[index]; // 当前子元素
    const newFiber = {
      type: element.type, // 元素类型，例如 'div', 'p', 'h1'
      props: element.props, // 元素属性
      parent: fiber, // 父 Fiber 指向当前 Fiber
      dom: null, // 新创建的 Fiber 还没有 DOM 节点
    };

    // 将新 Fiber 添加到 Fiber 树中
    if (index === 0) {
      // 如果是第一个子元素，就挂到父节点的 child 上
      fiber.child = newFiber;
    } else {
      // 如果不是第一个子元素，就挂到前一个子 Fiber 的 sibling上
      prevSibling.sibling = newFiber;
    }

    // 更新prevSibling，准备处理下一个子元素
    prevSibling = newFiber;
    // 移动到下一个子元素
    index++;
  }

  // TODO: 返回下一个要处理的 Fiber（子 -> 兄弟 -> 父的兄弟）
}
```

最后，我们开始寻找下一个要处理的工作单元，我们首先尝试处理子节点（child），如果没有子节点，则处理兄弟节点（sibling），如果既没有子节点也没有兄弟节点，则处理叔叔节点（父节点的兄弟节点），以此类推：

```js
// 执行当前 Fiber 的工作并返回下一个要处理的 Fiber
function performUnitOfWork(fiber) {
  // 如果当前 Fiber 没有对应的 DOM 节点，就创建一个
  if (!fiber.dom) {
    // createDom 会根据 type 和 props 创建真实 DOM
    fiber.dom = createDom(fiber);
  }
  // 如果当前 Fiber 有父节点，就把它对应的 DOM 挂到父节点的 DOM 上
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // 处理当前 Fiber 的子元素，准备为每个子元素创建 Fiber
  const elements = fiber.props.children; // 获取子元素数组
  let index = 0; // index 用于遍历子元素数组
  let prevSibling = null; // 用于记录前一个子 Fiber

  while (index < elements.length) {
    const element = elements[index]; // 当前子元素
    const newFiber = {
      type: element.type, // 元素类型，例如 'div', 'p', 'h1'
      props: element.props, // 元素属性
      parent: fiber, // 父 Fiber 指向当前 Fiber
      dom: null, // 新创建的 Fiber 还没有 DOM 节点
    };

    // 将新 Fiber 添加到 Fiber 树中
    if (index === 0) {
      // 如果是第一个子元素，就挂到父节点的 child 上
      fiber.child = newFiber;
    } else {
      // 如果不是第一个子元素，就挂到前一个子 Fiber 的 sibling上
      prevSibling.sibling = newFiber;
    }

    // 更新prevSibling，准备处理下一个子元素
    prevSibling = newFiber;
    // 移动到下一个子元素
    index++;
  }

  // 如果当前 Fiber 有子节点，直接返回子节点作为下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }
  // 如果没有子节点，则需要向上寻找兄弟节点或父节点的兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果当前 Fiber 有兄弟节点，返回兄弟节点作为下一个工作单元
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 如果没有兄弟节点，就向上移动到父节点，继续查找
    nextFiber = nextFiber.parent;
  }
  // 如果到达此处说明没有子节点、兄弟节点，也没有父节点可回溯
  // 本次渲染任务完成
}
```

如此便完成了 performUnitOfWork 函数。

## commit

但是此时还有一个问题：

每次处理一个元素时，我们都会将一个新的节点添加到 DOM 中，但是浏览器可能会在我们渲染完整棵树之前中断我们的工作，在这种情况下，用户会看到一个不完整的界面，而这是我们不希望发生的。

注意，这里的浏览器中断是指在 workLoop 执行过程中，如果浏览器剩余空闲时间不足，就会暂停循环，不再执行下一次 performUnitOfWork，这与单个工作单元执行时间过长导致主线程阻塞、界面卡顿是不同的。

因此我们需要把 performUnitOfWork 中直接修改 DOM 的部分移除：

```js
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 移除该部分
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  // }

  // ...
}
```

相反，我们会记录 Fiber 树的根节点，我们称它为“工作中的根”或 wipRoot（work in progress root）。

- wipRoot 是一个虚拟的 Fiber 树根，在工作阶段（work phase）构建 Fiber 树时使用
- 所有 DOM 更新不会立即应用到真实 DOM，而是在提交阶段（commit phase）一次性执行
- 这样可以避免用户看到不完整的 UI，同时仍支持浏览器中断和增量渲染

```js
// 当前正在构建的 Fiber 树的根节点（work in progress root）
let wipRoot = null;
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}
```

一旦我们完成了所有的工作（我们可以通过没有下一个工作单元来判断），就将整个 Fiber 树提交（commit）到 DOM 中。

```js
// 提交阶段：把工作阶段构建好的 Fiber 树一次性挂载到真实 DOM
function commitRoot() {
  // TODO: add nodes to dom
}

function workLoop(deadline) {
  // ...

  // 如果没有下一个工作单元了，并且存在根 Fiber
  // 表示工作阶段完成，开始提交阶段，将 Fiber 树一次性挂载到真实 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}
```

我们在 commitRoot 函数中完成这件事。这里我们会递归地将所有节点添加到 DOM 中：

```js
// 提交阶段：把工作阶段构建好的 Fiber 树一次性挂载到真实 DOM
function commitRoot() {
  // 从根 Fiber 的第一个子节点开始递归挂载
  commitWork(wipRoot.child);
  // 提交完成后，清空 wipRoot
  // 表示本次渲染任务已经完成
  wipRoot = null;
}

// 递归函数：将当前 Fiber 及其所有子孙节点挂载到 DOM
function commitWork(fiber) {
  // 如果 Fiber 不存在，直接返回
  if (!fiber) {
    return;
  }
  // 找到当前 Fiber 的父 DOM 节点
  const domParent = fiber.parent.dom;
  // 把当前 Fiber 对应的 DOM 节点挂载到父 DOM 上
  domParent.appendChild(fiber.dom);
  // 递归挂载子节点
  commitWork(fiber.child);
  // 递归挂载兄弟节点
  commitWork(fiber.sibling);
}
```

让我们回顾一下完整流程：

首先有如下两个全局变量：

```js
let nextUnitOfWork = null;
let wipRoot = null;
```

然后会执行：

```js
requestIdleCallback(workLoop);

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
```

即当浏览器空闲时，会执行 workLoop 函数。

然后此时由于 nextUnitOfWork 和 wipRoot 始终为 null，因此只会不断的执行 requestIdleCallback(workLoop)进入空转调度循环。

直到执行：

```js
const element = SimpleReact.createElement(
  "div",
  { className: "container" },
  SimpleReact.createElement("h1", null, "Simple React"),
  SimpleReact.createElement("p", null, "Year: ", 2025)
);
const container = document.getElementById("root");
SimpleReact.render(element, container);
```

然后初始化 wipRoot，也就是 fiber 树的根节点，然后赋值给 nextUnitOfWork，相当于下一个工作单元就是 fiber 树的根节点：

```js
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}
```

由于此时还在循环调度：

```js
requestIdleCallback(workLoop);

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
```

因此会又一次执行 workLoop 函数，此时会进入 while 循环，然后执行 performUnitOfWork 函数，传入的 fiber 就是 fiber 树的根节点，而根节点初始化时，dom 为 container，并不为空，因此不会 createDom。

而 elements 会被赋值为 fiber.props.children 也就是 element：

```js
const element = SimpleReact.createElement(
  "div",
  { className: "container" },
  SimpleReact.createElement("h1", null, "Simple React"),
  SimpleReact.createElement("p", null, "Year: ", 2025)
);
```

也就是：

```js
[
  {
    type: "div",
    props: {
      className: "container",
      children: [
        {
          type: "h1",
          props: {
            children: [
              {
                type: "TEXT_ELEMENT",
                props: {
                  nodeValue: "Simple React",
                  children: [],
                },
              },
            ],
          },
        },
        {
          type: "p",
          props: {
            children: [
              {
                type: "TEXT_ELEMENT",
                props: {
                  nodeValue: "Year: ",
                  children: [],
                },
              },
              {
                type: "TEXT_ELEMENT",
                props: {
                  nodeValue: 2025,
                  children: [],
                },
              },
            ],
          },
        },
      ],
    },
  },
];
```

因此 elements.length 为 1,所以会进入 while 循环，所以 element 为 elements[0]即：

```js
{
  type: "div",
  props: {
    className: "container",
    children: [
      {
        type: "h1",
        props: {
          children: [
            {
              type: "TEXT_ELEMENT",
              props: {
                nodeValue: "Simple React",
                children: [],
              },
            },
          ],
        },
      },
      {
        type: "p",
        props: {
          children: [
            {
              type: "TEXT_ELEMENT",
              props: {
                nodeValue: "Year: ",
                children: [],
              },
            },
            {
              type: "TEXT_ELEMENT",
              props: {
                nodeValue: 2025,
                children: [],
              },
            },
          ],
        },
      },
    ],
  },
}
```

因此会创建一个 newFiber，dom 为 null，type 和 props 直接为 elements[0]的 type 和 props，parent 指向 fiber

由于 index 为 0,因此 fiber 的 child 就是 newFiber，以及 prevSibling 为 newFiber

然后 index++但是不符合 while 循环条件，因此跳出 while

然后 fiber 此时的 child 就是 newFiber，因此直接返回 newFiber

然后如果浏览器有空闲时间则继续把 newFiber 给 performUnitOfWork 函数执行，如果没有则等到下一次浏览器有时间时

当最后一次执行完 performUnitOfWork 时，nextUnitOfWork 被赋值为 undefined，因此会执行 commitRoot 函数，即从 fiber 根的第一个子节点开始 commitWork，也就是按照当前、子节点、兄弟节点的顺序递归执行 commitWork，知道没有 fiber 时将 wipRoot 赋值为 null，此时 workLoop 将再次进入空转调度循环。

## Reconciliation

但是到目前位置，我们只向 DOM 添加了内容，但是还不能更新或删除节点，因此我们需要将 render 函数接收到的最新 element 树，与上一次已经提交到 DOM 的 Fiber 树进行比较。

因此，在一次提交（commit）完成后，我们需要保存对“上一次提交到 DOM 的 Fiber 树”的引用。

我们把这个引用称为 currentRoot，代码如下：

```js
// 下一个要处理的工作单元（即一个 Fiber 节点）
let nextUnitOfWork = null;
// 当前正在构建的 Fiber 树的根节点（work in progress root）
let wipRoot = null;
// 当前已经提交到 DOM 的 Fiber 树的根节点（上一次渲染完成的 Fiber 树）
let currentRoot = null;

// 提交阶段：把工作阶段构建好的 Fiber 树一次性挂载到真实 DOM
function commitRoot() {
  // 从根 Fiber 的第一个子节点开始递归挂载
  commitWork(wipRoot.child);
  // 将当前构建完成并提交的 Fiber 树保存为 currentRoot
  // 下次更新时可以与它进行比较（用于 diff）
  currentRoot = wipRoot;
  // 提交完成后，清空 wipRoot
  // 表示本次渲染任务已经完成
  wipRoot = null;
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 保存上一次提交的 Fiber 树引用，用于后续比较（alternate 即“旧树”）
    alternate: currentRoot,
  };
  nextUnitOfWork = wipRoot;
}
```

现在我们来把 performUnitOfWork 中创建新 Fiber 的那部分代码提取出来，放到一个新的 reconcileChildren 函数里：

```js
// 执行当前 Fiber 的工作并返回下一个要处理的 Fiber
function performUnitOfWork(fiber) {
  // 如果当前 Fiber 没有对应的 DOM 节点，就创建一个
  if (!fiber.dom) {
    // createDom 会根据 type 和 props 创建真实 DOM
    fiber.dom = createDom(fiber);
  }
  // 处理当前 Fiber 的子元素，准备为每个子元素创建 Fiber
  const elements = fiber.props.children; // 获取子元素数组
  // 将子元素与 Fiber 树进行协调
  reconcileChildren(fiber, elements);

  // 如果当前 Fiber 有子节点，直接返回子节点作为下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }
  // 如果没有子节点，则需要向上寻找兄弟节点或父节点的兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果当前 Fiber 有兄弟节点，返回兄弟节点作为下一个工作单元
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 如果没有兄弟节点，就向上移动到父节点，继续查找
    nextFiber = nextFiber.parent;
  }
  // 如果到达此处说明没有子节点、兄弟节点，也没有父节点可回溯
  // 本次渲染任务完成
}

// 协调子元素
function reconcileChildren(wipFiber, elements) {
  let index = 0; // index 用于遍历子元素数组
  let prevSibling = null; // 用于记录前一个子 Fiber

  while (index < elements.length) {
    const element = elements[index]; // 当前子元素
    const newFiber = {
      type: element.type, // 元素类型，例如 'div', 'p', 'h1'
      props: element.props, // 元素属性
      parent: wipFiber, // 父 Fiber 指向当前 Fiber
      dom: null, // 新创建的 Fiber 还没有 DOM 节点
    };

    // 将新 Fiber 添加到 Fiber 树中
    if (index === 0) {
      // 如果是第一个子元素，就挂到父节点的 child 上
      wipFiber.child = newFiber;
    } else {
      // 如果不是第一个子元素，就挂到前一个子 Fiber 的 sibling上
      prevSibling.sibling = newFiber;
    }

    // 更新prevSibling，准备处理下一个子元素
    prevSibling = newFiber;
    // 移动到下一个子元素
    index++;
  }
}
```

在这个函数里，我们将 新传入的元素（elements） 与 旧的 Fiber 节点（old fibers） 进行 协调（reconcile）。

我们会遍历旧 Fiber 的子节点（wipFiber.alternate）和我们想要协调的元素数组。

如果忽略同时遍历数组和链表所需的各种模板代码，最核心的部分就是 oldFiber 和 element：

- element 是我们这次想要渲染到 DOM 的元素
- oldFiber 是我们上一次渲染到 DOM 的 Fiber 节点

我们需要比较它们，看看是否任何变化需要应用到 DOM 上。

```js
// 协调子元素
function reconcileChildren(wipFiber, elements) {
  let index = 0; // index 用于遍历子元素数组
  // 获取上一次提交的 Fiber 树的第一个子节点（如果存在的话）
  // 这样我们可以在协调阶段比较新元素和旧 Fiber
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null; // 用于记录前一个子 Fiber

  // 当还有新的元素没有处理，或者还有旧 Fiber 节点没有处理时继续循环
  // 这样可以同时遍历新元素数组和旧 Fiber 链表，便于进行 diff
  while (
    index < elements.length ||
    (oldFiber !== null && oldFiber !== undefined)
  ) {
    const element = elements[index]; // 当前新元素
    let newFiber = null; // 将要创建的 Fiber，稍后可能基于 oldFiber 复用或更新

    // TODO: compare oldFiber to element

    if (oldFiber) {
      // 移动到旧 Fiber 的下一个兄弟节点
      oldFiber = oldFiber.sibling;
    }
    // 将新 Fiber 添加到 Fiber 树中
    if (index === 0) {
      // 如果是第一个子元素，就挂到父节点的 child 上
      wipFiber.child = newFiber;
    } else {
      // 如果不是第一个子元素，就挂到前一个子 Fiber 的 sibling上
      prevSibling.sibling = newFiber;
    }

    // 更新prevSibling，准备处理下一个子元素
    prevSibling = newFiber;
    // 移动到下一个子元素
    index++;
  }
}
```

我们通过 type 来比较新旧节点：

1. 如果旧 Fiber 和新元素类型相同

- 可以复用原来的 DOM 节点，只需要用新的 props 更新它

2. 如果类型不同且存在新元素

- 表示我们需要创建一个新的 DOM 节点

3. 如果类型不同且存在旧 Fiber

- 表示需要删除旧的 DOM 旧 Fiber

React 还会使用 key 来优化协调过程（reconciliation）。
例如，它可以检测到子节点在元素数组中的位置发生变化，从而更高效地更新 DOM。

```js
// 判断旧 Fiber 和当前元素类型是否相同
const sameType = oldFiber && element && element.type === oldFiber.type;
if (sameType) {
  // TODO: update the node
}
if (element && !sameType) {
  // TODO: add this node
}
if (oldFiber && !sameType) {
  // TODO: delete the oldFiber's node
}
```

当 oldFiber 和 element 居右相同类型时，我们会创建一个新的 fiber，保留 oldFiber 中的 DOM 节点和元素中的 props，我们还为 fiber 添加了一个新属性：effectTag，稍后会在提交阶段使用此属性：

```js
// 判断旧 Fiber 和当前元素类型是否相同
const sameType = oldFiber && element && element.type === oldFiber.type;
if (sameType) {
  newFiber = {
    type: oldFiber.type,
    props: element.props,
    dom: oldFiber.dom,
    parent: wipFiber,
    alternate: oldFiber,
    effectTag: "UPDATE",
  };
}
```

对于需要创建新 DOM 节点的元素，我们会给对应的 新 Fiber 打上 PLACEMENT 的 effect 标记：

```js
if (element && !sameType) {
  newFiber = {
    type: element.type,
    props: element.props,
    dom: null,
    parent: wipFiber,
    alternate: null,
    effectTag: "PLACEMENT",
  };
}
```

对于需要删除节点的情况，我们没有新的 Fiber，所以会把 effectTag 添加到 旧 Fiber 上。

但是，当我们把 Fiber 树提交（commit）到 DOM 时，我们是从 work-in-progress 根节点（wipRoot） 开始的，而 wipRoot 中并不包含旧的 Fiber，因此，我们需要一个数组来记录需要删除的节点：

```js
// 全局数组，用于存储在协调阶段标记为删除的旧 Fiber
let deletions = null;
function performUnitOfWork(fiber) {
  // ...
  if (oldFiber && !sameType) {
    oldFiber.effectTag = "DELETION";
    deletions.push(oldFiber);
  }
  // ...
}
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 保存上一次提交的 Fiber 树引用，用于后续比较（alternate 即“旧树”）
    alternate: currentRoot,
  };
  // 每次渲染前初始化 deletions 数组，用于存放当前渲染需要删除的旧 Fiber
  deletions = [];
  nextUnitOfWork = wipRoot;
}
```

然后，当我们将更改提交到 DOM 时，我们也会使用 存储在 deletions 数组中的 Fiber：

```js
function commitRoot() {
  deletions.forEach(commitWork);
  // ...
}
```

现在，让我们修改 commitWork 函数，以便处理新的 effectTag（更新、插入、删除）操作。

我们不再直接把当前 Fiber 对应的 DOM 节点挂载到父 DOM 上：

而是，如果某个 Fiber 的 effectTag 是 PLACEMENT，我们就和之前一样——将该 Fiber 对应的 DOM 节点添加到其父 Fiber 的 DOM 节点中：

```js
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

如果某个 Fiber 的 effectTag 是 DELETION，我们就执行相反的操作——将该子节点从父节点中移除。：

```js
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

如果某个 Fiber 的 effectTag 是 UPDATE，我们就需要使用更新后的属性（props）去更新已有的 DOM 节点：

```js
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

我们来自己实现一个 updateDom 函数：

```js
function updateDom(dom, prevProps, nextProps) {
  // TODO
}
```

我们会比较旧 Fiber 的 props 与新 Fiber 的 props，
移除那些已经不存在的属性，并设置那些新增或已更改的属性：

```js
// 判断属性是否是普通属性（排除children）
const isProperty = (key) => key !== "children";
// 判断属性是否是“新属性”或“值已改变”
// 返回一个函数，用于比较某个 key 在新旧 props 中的值是否不同
const isNew = (prev, next) => (key) => prev[key] !== next[key];
// 判断属性是否“已被删除”
// 返回一个函数，用于判断某个 key 是否在新 props 中不存在
const isGone = (prev, next) => (key) => !(key in next);
// 更新 DOM 节点的属性：移除旧的、设置新的
function updateDom(dom, prevProps, nextProps) {
  // 移除旧的属性
  Object.keys(prevProps)
    .filter(isProperty) // 过滤掉 children 属性
    .filter(isGone(prevProps, nextProps)) // 找出已被删除的属性
    .forEach((name) => {
      dom[name] = ""; // 将该属性重置为空字符串，相当于删除
    });

  // 添加新的属性或更新已更改的属性
  Object.keys(nextProps)
    .filter(isProperty) // 同样忽略 children
    .filter(isNew(prevProps, nextProps)) // 找出新添加或值已变化的属性
    .forEach((name) => {
      dom[name] = nextProps[name]; // 更新 DOM 上对应的属性值
    });
}
```

我们还需要更新的一类特殊属性是事件监听器（event listeners）。
因此，如果属性名（prop name）是以 "on" 前缀开头的（比如 onClick、onInput、onChange 等），我们就要对它们进行不同的处理：

```js
// 判断是否是时间（以 on 开头）
const isEvent = (key) => key.startsWith("on");
// 判断属性是否是普通属性（排除children以及事件）
const isProperty = (key) => key !== "children" && !isEvent(key);
```

如果某个事件处理函数（event handler）发生了变化（即新旧 props 中同名事件的回调函数不同），我们就需要先从 DOM 节点上移除旧的事件监听器：

```js
// 更新 DOM 节点的属性：移除旧的、设置新的
function updateDom(dom, prevProps, nextProps) {
  // 移除旧的或者变更的时间监听器
  Object.keys(prevProps) // 获取旧的所有属性名
    .filter(isEvent) // 只保留事件相关的属性（例如onClick、onInput）
    .filter(
      (
        key // 进一步筛选需要移除的事件监听器：
      ) =>
        !(key in nextProps) || // 如果新 props 中没有这个事件（说明被移除了）
        isNew(prevProps, nextProps)(key) // 或者事件监听函数已经发生了变化（说明需要更新）
    )
    .forEach((name) => {
      // 对所有符合条件的事件名执行以下操作：
      // 把事件名从例如 "onClick" 转为 "click"
      // toLowerCase() -> "onclick"，substring(2) 去掉前两个字符 "on"
      const eventType = name.toLowerCase().substring(2);
      // 从真实 DOM 上移除旧的事件监听器
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // ...
}
```

在移除了旧的事件监听器之后，我们需要将新的事件处理函数绑定到 DOM 节点上，也就是用 addEventListener 添加新的回调：

```js
// 更新 DOM 节点的属性：移除旧的、设置新的
function updateDom(dom, prevProps, nextProps) {
  // ...

  // 添加事件监听器
  Object.keys(nextProps) // 获取新 props 的所有属性名
    .filter(isEvent) // 只保留事件相关的属性（如 onClick、onInput 等）
    .filter(isNew(prevProps, nextProps)) // 只保留新添加的或已经变化的事件监听器
    .forEach((name) => {
      // 对每一个符合条件的事件属性执行以下操作：
      //   toLowerCase() -> "onclick"
      //   substring(2) 去掉前两个字符 "on"
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
      // 将新的事件处理函数绑定到 DOM 节点上
    });
}
```

然后我们在 createDom 的时候也改为使用 updateDom：

```js
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}
```

最终代码如下：

```js
// 下一个要处理的工作单元（即一个 Fiber 节点）
let nextUnitOfWork = null;
// 当前正在构建的 Fiber 树的根节点（work in progress root）
let wipRoot = null;
// 当前已经提交到 DOM 的 Fiber 树的根节点（上一次渲染完成的 Fiber 树）
let currentRoot = null;
// 全局数组，用于存储在协调阶段标记为删除的旧 Fiber
let deletions = null;

// 判断是否是时间（以 on 开头）
const isEvent = (key) => key.startsWith("on");
// 判断属性是否是普通属性（排除children以及事件）
const isProperty = (key) => key !== "children" && !isEvent(key);
// 判断属性是否是“新属性”或“值已改变”
// 返回一个函数，用于比较某个 key 在新旧 props 中的值是否不同
const isNew = (prev, next) => (key) => prev[key] !== next[key];
// 判断属性是否“已被删除”
// 返回一个函数，用于判断某个 key 是否在新 props 中不存在
const isGone = (prev, next) => (key) => !(key in next);

// 提交阶段：把工作阶段构建好的 Fiber 树一次性挂载到真实 DOM
function commitRoot() {
  deletions.forEach(commitWork);
  // 从根 Fiber 的第一个子节点开始递归挂载
  commitWork(wipRoot.child);
  // 将当前构建完成并提交的 Fiber 树保存为 currentRoot
  // 下次更新时可以与它进行比较（用于 diff）
  currentRoot = wipRoot;
  // 提交完成后，清空 wipRoot
  // 表示本次渲染任务已经完成
  wipRoot = null;
}

// 递归函数：将当前 Fiber 及其所有子孙节点挂载到 DOM
function commitWork(fiber) {
  // 如果 Fiber 不存在，直接返回
  if (!fiber) {
    return;
  }
  // 找到当前 Fiber 的父 DOM 节点
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  // 递归挂载子节点
  commitWork(fiber.child);
  // 递归挂载兄弟节点
  commitWork(fiber.sibling);
}

// 更新 DOM 节点的属性：移除旧的、设置新的
function updateDom(dom, prevProps, nextProps) {
  // 移除旧的或者变更的时间监听器
  Object.keys(prevProps) // 获取旧的所有属性名
    .filter(isEvent) // 只保留事件相关的属性（例如onClick、onInput）
    .filter(
      (
        key // 进一步筛选需要移除的事件监听器：
      ) =>
        !(key in nextProps) || // 如果新 props 中没有这个事件（说明被移除了）
        isNew(prevProps, nextProps)(key) // 或者事件监听函数已经发生了变化（说明需要更新）
    )
    .forEach((name) => {
      // 对所有符合条件的事件名执行以下操作：
      // 把事件名从例如 "onClick" 转为 "click"
      // toLowerCase() -> "onclick"，substring(2) 去掉前两个字符 "on"
      const eventType = name.toLowerCase().substring(2);
      // 从真实 DOM 上移除旧的事件监听器
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 移除旧的属性
  Object.keys(prevProps)
    .filter(isProperty) // 过滤掉 children 属性
    .filter(isGone(prevProps, nextProps)) // 找出已被删除的属性
    .forEach((name) => {
      dom[name] = ""; // 将该属性重置为空字符串，相当于删除
    });

  // 添加新的属性或更新已更改的属性
  Object.keys(nextProps)
    .filter(isProperty) // 同样忽略 children
    .filter(isNew(prevProps, nextProps)) // 找出新添加或值已变化的属性
    .forEach((name) => {
      dom[name] = nextProps[name]; // 更新 DOM 上对应的属性值
    });

  // 添加事件监听器
  Object.keys(nextProps) // 获取新 props 的所有属性名
    .filter(isEvent) // 只保留事件相关的属性（如 onClick、onInput 等）
    .filter(isNew(prevProps, nextProps)) // 只保留新添加的或已经变化的事件监听器
    .forEach((name) => {
      // 对每一个符合条件的事件属性执行以下操作：
      //   toLowerCase() -> "onclick"
      //   substring(2) 去掉前两个字符 "on"
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
      // 将新的事件处理函数绑定到 DOM 节点上
    });
}

// 工作循环
function workLoop(deadline) {
  // 是否应该让出主线程
  let shouldYield = false;
  // 当存在下一个 Fiber 节点并且不需要让出主线程时
  while (nextUnitOfWork && !shouldYield) {
    // 执行当前 Fiber 的工作，并返回下一个要处理的 Fiber
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 如果剩余时间不足，则让出主线程，等待浏览器空闲时继续
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 如果没有下一个工作单元了，并且存在根 Fiber
  // 表示工作阶段完成，开始提交阶段，将 Fiber 树一次性挂载到真实 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  // 在浏览器下次空闲时继续执行工作循环
  requestIdleCallback(workLoop);
}

// 启动第一次工作循环
requestIdleCallback(workLoop);

// 执行当前 Fiber 的工作并返回下一个要处理的 Fiber
function performUnitOfWork(fiber) {
  // 如果当前 Fiber 没有对应的 DOM 节点，就创建一个
  if (!fiber.dom) {
    // createDom 会根据 type 和 props 创建真实 DOM
    fiber.dom = createDom(fiber);
  }
  // 处理当前 Fiber 的子元素，准备为每个子元素创建 Fiber
  const elements = fiber.props.children; // 获取子元素数组
  // 将子元素与 Fiber 树进行协调
  reconcileChildren(fiber, elements);

  // 如果当前 Fiber 有子节点，直接返回子节点作为下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }
  // 如果没有子节点，则需要向上寻找兄弟节点或父节点的兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果当前 Fiber 有兄弟节点，返回兄弟节点作为下一个工作单元
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 如果没有兄弟节点，就向上移动到父节点，继续查找
    nextFiber = nextFiber.parent;
  }
  // 如果到达此处说明没有子节点、兄弟节点，也没有父节点可回溯
  // 本次渲染任务完成
}

// 协调子元素
function reconcileChildren(wipFiber, elements) {
  let index = 0; // index 用于遍历子元素数组
  // 获取上一次提交的 Fiber 树的第一个子节点（如果存在的话）
  // 这样我们可以在协调阶段比较新元素和旧 Fiber
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null; // 用于记录前一个子 Fiber

  // 当还有新的元素没有处理，或者还有旧 Fiber 节点没有处理时继续循环
  // 这样可以同时遍历新元素数组和旧 Fiber 链表，便于进行 diff
  while (
    index < elements.length ||
    (oldFiber !== null && oldFiber !== undefined)
  ) {
    const element = elements[index]; // 当前新元素
    let newFiber = null; // 将要创建的 Fiber，稍后可能基于 oldFiber 复用或更新

    // 判断旧 Fiber 和当前元素类型是否相同
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      // 旧 Fiber 与新元素类型不同，标记为删除
      oldFiber.effectTag = "DELETION";
      // 将需要删除的 Fiber 添加到 deletions 数组中
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      // 移动到旧 Fiber 的下一个兄弟节点
      oldFiber = oldFiber.sibling;
    }
    // 将新 Fiber 添加到 Fiber 树中
    if (index === 0) {
      // 如果是第一个子元素，就挂到父节点的 child 上
      wipFiber.child = newFiber;
    } else {
      // 如果不是第一个子元素，就挂到前一个子 Fiber 的 sibling上
      prevSibling.sibling = newFiber;
    }

    // 更新prevSibling，准备处理下一个子元素
    prevSibling = newFiber;
    // 移动到下一个子元素
    index++;
  }
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 保存上一次提交的 Fiber 树引用，用于后续比较（alternate 即“旧树”）
    alternate: currentRoot,
  };
  // 每次渲染前初始化 deletions 数组，用于存放当前渲染需要删除的旧 Fiber
  deletions = [];
  nextUnitOfWork = wipRoot;
}

const SimpleReact = {
  createElement,
  render,
};

const container = document.getElementById("root");

const updateValue = (e) => {
  rerender(e.target.value);
};

const rerender = (value) => {
  const element = SimpleReact.createElement(
    "div",
    null,
    SimpleReact.createElement("input", { onInput: updateValue, value }),
    SimpleReact.createElement("h2", null, "Hello " + value)
  );
  SimpleReact.render(element, container);
};

rerender("World");
```
