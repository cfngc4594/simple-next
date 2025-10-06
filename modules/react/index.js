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
