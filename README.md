# 办公辅助插件开发文档

## 1. 项目概述

本插件旨在增强多个办公网站功能，采用模块化设计，包含以下主要组件：

- **核心模块 (core/)**: 基础功能实现
- **UI组件 (ui/)**: 通用界面组件
- **网站处理模块 (sites/)**: 特定网站功能增强
- **管理模块**: 负责组织和调度各模块

## 2. 添加新网站支持

按以下步骤添加新网站支持：

### 2.1 创建网站处理函数文件

在`sites/`目录创建新文件，命名为`handle{网站名称}.js`：

```javascript
/**
 * 处理{网站名称}网站的{页面类型}页面
 * @param {Object} pageInfo - 包含页面信息的对象(url等)
 * @returns {void}
 */
function handle{网站名称}(pageInfo) {
  console.log("处理{网站名称}网站: " + pageInfo.url);
  
  // 实现特定处理逻辑
}
```

### 2.2 在siteManager.js注册网站配置

在`siteManager.js`的`siteConfigs`数组中添加：

```javascript
{
  url: "example.com", // 网站域名
  routes: [
    {
      path: "/dashboard", // 路径匹配规则
      matchType: "pathPrefix", // 匹配方式(可选)，不设置时默认为"pathPrefix"
      handler: handleExample, // 对应处理函数
    },
    // 可添加多个路由规则
  ],
},
```

路由匹配规则说明：
- `path` - 路径匹配规则
- `matchType` - 匹配方式(可选)，可选值：
  - `"exact"` - 精确匹配(路径、参数、hash都必须完全一致)
  - `"pathExact"` - 路径精确匹配(只匹配路径部分，忽略参数和hash)
  - `"pathPrefix"` - 部分路径匹配(匹配以此开头的所有路径)
  - `"regex"` - 正则表达式匹配

匹配逻辑：
- path="/"且不设置matchType：全部页面匹配
- path="/"且设置matchType：按设置的matchType规则匹配
- path!="/"且不设置matchType：默认使用"pathPrefix"(部分路径匹配)
- path!="/"且设置matchType：按设置的matchType规则匹配

示例：
```javascript
{
  path: "/",  // 匹配所有页面
  handler: handleAllPages
},
{
  path: "/products",
  matchType: "exact",  // 精确匹配，只匹配完全一致的URL
  handler: handleProductsExact
},
{
  path: "/catalog", 
  matchType: "pathExact",  // 路径精确匹配，忽略参数和hash
  handler: handleCatalog
},
{
  path: "/blog", 
  // 不设置matchType，默认使用pathPrefix匹配
  handler: handleBlog
},
{
  path: "/^\\\/users\\\/\\d+\\\/profile$/",
  matchType: "regex",  // 正则表达式匹配
  handler: handleUserProfile
}
```

### 2.3 在manifest.json添加脚本引用

在`manifest.json`中找到sites部分：

```json
{
  "matches": [
    "<all_urls>"
  ],
  "js": [
    "sites/handleAndfleet.js",
    "sites/handle{新网站}.js"  // 添加新文件
  ],
  "run_at": "document_idle"
}
```

## 3. 添加新UI组件

UI组件必须严格遵循三段式结构：CSS、HTML和JS完全分离。

### 3.1 创建UI组件文件

在`ui/`目录创建新文件，如`myComponent.js`：

```javascript
//==============================================================
// CSS 部分 - 处理所有样式定义
//==============================================================
(function() {
  var CSS = {
    styleContent: `
      .ui-my-component {
        /* 样式定义 */
      }
    `
  };

//==============================================================
// HTML 部分 - 创建DOM结构
//==============================================================
  var HTML = {
    createElements: function() {
      var container = document.createElement('div');
      container.className = 'ui-my-component';
      // 创建其他DOM元素
      return container;
    }
  };

//==============================================================
// JS 部分 - 组件逻辑
//==============================================================
  /**
   * 我的组件类
   * @param {Object} options - 配置选项
   */
  function MyComponent(options) {
    var _options = options || {};
    var _container = null;
    
    // 私有方法
    function _applyStyles() {
      if (!document.querySelector('#ui-my-component-style')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'ui-my-component-style';
        styleEl.textContent = CSS.styleContent;
        document.head.appendChild(styleEl);
      }
    }
    
    // 初始化
    _applyStyles();
    _container = HTML.createElements();
    
    //----
    // 对外公开方法
    //----
    this.appendTo = function(parentElement) {
      parentElement.appendChild(_container);
      return this;
    };
    
    // 其他公开方法
  }
  
  // 便捷创建函数
  function createMyComponent(options) {
    return new MyComponent(options);
  }
  
  // 初始化全局UI命名空间
  window.UI = window.UI || {};
  
  // 暴露到全局
  window.UI.MyComponent = MyComponent;
  window.UI.createMyComponent = createMyComponent;

//==============================================================
// 对外方法文档 
//==============================================================
/**
 * MyComponent 类提供以下对外方法：
 * 
 * 创建组件:
 * - new window.UI.MyComponent(options) - 创建组件实例
 *   - options.param1: 参数说明
 * 
 * DOM操作:
 * - appendTo(element) - 将组件添加到指定元素
 *   - element: 父元素
 * 
 * 所有方法均支持链式调用: instance.method1().method2()
 */
})();
```

### 3.2 在manifest.json添加引用

在`manifest.json`中找到ui部分：

```json
{
  "matches": [
    "<all_urls>"
  ],
  "js": [
    "ui/expandButton.js",
    "ui/centerModal.js",
    "ui/excelTable.js",
    "ui/myComponent.js"  // 添加新组件
  ],
  "run_at": "document_idle"
}
```

## 4. 使用核心系统

### 4.1 URL监控系统 (urlMonitor.js)

核心函数: `initUrlMonitor`

用于检测页面URL变化，包括单页应用：

```javascript
// 引用URL监控系统
if (window.UrlMonitor) {
  /**
   * 初始化URL监控
   * @param {Function} onUrlChange - URL变化时的回调函数，参数为当前URL
   * @param {boolean} checkImmediately - 是否立即执行一次URL检查，默认为false
   */
  window.UrlMonitor.initUrlMonitor(function(url) {
    console.log("URL已变化为: " + url);
    // 处理URL变化逻辑
  }, true); // 第二个参数为true表示立即检查当前URL
}
```

### 4.2 存储管理系统 (storageManager.js)

用于数据存储和管理，提供站点特定存储和跨域共享存储功能：

```javascript
// 引用存储管理系统
if (window.StorageManager) {
  /**
   * 获取指定站点的存储对象
   * @param {string} siteName - 站点名称，用于隔离不同站点的数据
   * @returns {Promise<Object>} 返回Promise，resolve后获得存储对象
   */
  window.StorageManager.getStorage('exampleSite').then(function(storage) {
    // 使用存储对象
    storage.userPreferences = { theme: 'dark' }; // 自动保存
    console.log(storage.userPreferences); // 读取数据
    delete storage.tempData; // 删除数据
  });
  
  /**
   * 获取共享存储对象，可跨站点访问
   * @param {string} namespace - 命名空间，必须提供
   * @returns {Promise<Object>} 返回Promise，resolve后获得共享存储对象
   */
  window.StorageManager.getSharedStorage('globalSettings').then(function(sharedStorage) {
    // 使用共享存储对象，与普通存储用法相同
    sharedStorage.language = 'zh-CN';
  });
}
```

### 4.3 通用工具函数 (utils.js)

提供多种DOM操作和页面交互辅助函数：

```javascript
// 引用工具函数
if (window.Utils) {
  /**
   * 等待DOM结构稳定后执行
   * @param {number} waitTime - 等待DOM稳定的时间(毫秒)，默认3000ms
   * @param {number} timeout - 超时时间(毫秒)，默认30000ms
   * @param {Object} options - 配置选项
   * @returns {Promise<void>} 当DOM稳定时resolved的Promise
   */
  window.Utils.waitForDOMStable(2000, 20000, {
    target: document.querySelector('#app'), // 要观察的目标节点
    subtree: true, // 是否观察后代节点变化
    childList: true, // 是否观察子节点变化
    attributes: true, // 是否观察属性变化
    characterData: true, // 是否观察节点内容变化
    checkUrlChange: true // 是否在URL变化时取消等待
  }).then(function() {
    console.log('DOM已稳定，可以安全操作');
  }).catch(function(error) {
    console.error('等待DOM稳定失败:', error);
  });
  
  /**
   * 等待特定元素出现在DOM中
   * @param {string} selector - 要等待的元素的CSS选择器
   * @param {number} timeout - 等待超时时间(毫秒)，默认10000ms
   * @param {Object} options - 配置选项
   * @returns {Promise<Element>} 返回找到的元素
   */
  window.Utils.waitForElement('.dashboard-header', 5000, {
    checkUrlChange: true, // 是否在URL变化时取消等待
    root: document // 要观察的根节点
  }).then(function(element) {
    console.log('找到目标元素:', element);
  }).catch(function(error) {
    console.error('等待元素失败:', error);
  });
  
  /**
   * 创建元素状态监视器
   * @param {string} selector - 要监控的元素的CSS选择器
   * @param {Object} options - 配置选项
   * @returns {Object} 返回监听器对象，包含onAppear、onDisappear和stop方法
   */
  var monitor = window.Utils.createElementMonitor('.dynamic-element', {
    checkInterval: 300, // 检查元素的间隔时间(毫秒)
    useMutationObserver: true, // 是否使用MutationObserver来提高性能
    stableTime: 100, // 元素需要稳定存在的时间(毫秒)
    root: document // 要观察的根节点
  });
  
  // 链式调用设置回调
  monitor
    .onAppear(function(element) {
      console.log('元素已出现:', element);
    })
    .onDisappear(function() {
      console.log('元素已消失');
    })
    .onNotFound(function() {
      console.log('元素未找到');
    });
    
  // 停止监控
  // monitor.stop();
  
  /**
   * 确保回调函数只执行一次，生成随机标识符并监控URL变化
   * @returns {Promise} 返回Promise对象，resolve时会传入当前URL
   */
  window.Utils.ensureOnce().then(function(currentUrl) {
    console.log('此代码仅执行一次，当前URL:', currentUrl);
  });
}
```

这些核心系统函数设计用于处理常见的浏览器扩展开发场景，如监控DOM变化、等待特定元素出现、管理数据存储等，能大大简化网站处理模块的开发。

## 5. 开发最佳实践

### 5.1 网站处理模块

- 一个处理函数只负责一种页面类型
- 复杂逻辑分解为多个函数，保持主函数简洁
- 使用详细JSDoc注释说明功能和参数

### 5.2 UI组件开发

- 严格遵循三段式结构
- 所有样式使用`ui-`前缀避免冲突
- 组件必须支持链式调用
- 不在构造函数中直接操作DOM，提供appendTo方法

### 5.3 调试技巧

- 使用`console.log`输出关键信息
- 在处理函数中添加标记，确认其被调用
- 使用浏览器开发者工具检查DOM变化

## 6. 示例：完整流程

### 添加对ExampleSite网站的支持

1. 创建处理函数文件`sites/handleExampleSite.js`：
```javascript
/**
 * 处理ExampleSite网站的仪表盘页面
 * @param {Object} pageInfo - 包含页面信息的对象
 * @returns {void}
 */
function handleExampleSite(pageInfo) {
  console.log("处理ExampleSite网站: " + pageInfo.url);
  
  // 创建增强按钮
  var button = window.UI.createExpandButton({
    text: "导出数据",
    onClick: function() {
      // 导出数据逻辑
    }
  });
  
  // 添加到页面指定位置
  var targetElement = document.querySelector('.dashboard-header');
  if (targetElement) {
    button.appendTo(targetElement);
  }
}
```

2. 在`siteManager.js`注册配置：
```javascript
{
  url: "example.com",
  routes: [
    {
      path: "/dashboard",
      matchType: "pathPrefix", // 可省略，默认为pathPrefix
      handler: handleExampleSite,
    },
  ],
},
```

3. 在`manifest.json`添加引用：
```json
"js": [
  "sites/handleAndfleet.js",
  "sites/handleExampleSite.js"
]
```

遵循以上文档说明，即可快速为插件添加新网站支持和新UI组件。