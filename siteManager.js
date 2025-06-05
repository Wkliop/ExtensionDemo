/**
 * @fileoverview 网站管理模块，负责集中管理所有支持的网站配置及处理逻辑
 */

(function () {
  /**
   * 站点配置数组，定义支持的网站和对应的路由规则
   * 匹配方式规则：
   * - path="/"且不设置matchType: 全部页面匹配
   * - path="/"且设置matchType: 按设置的matchType规则匹配
   * - path!="/"且不设置matchType: 默认使用"pathPrefix"(部分路径匹配)
   * - path!="/"且设置matchType: 按设置的matchType规则匹配
   * 
   * matchType可选值:
   * - "exact": 精确匹配，路径、参数、hash都必须完全一致
   * - "pathExact": 路径精确匹配，只匹配路径部分，忽略参数和hash
   * - "pathPrefix": 部分路径匹配，匹配以此开头的所有路径
   * - "regex": 正则表达式匹配，"/^正则$/格式"
   * @type {Array<Object>}
   */
  var siteConfigs = [
    {
      url: "andfleet.cm-iov.com",
      routes: [
        {
          path: "/v1/evhe/#/order/",
          matchType: "pathPrefix",
          handler: handleAndfleet,
        },
      ],
    },
  ];

  /**
   * 根据URL查找对应的处理函数
   * @param {string} url - 需要处理的URL
   * @returns {Function|null} 返回对应的处理函数，未找到则返回null
   */
  function findHandlerForUrl(url) {
    console.log("查找URL处理函数: " + url);

    try {
      var urlObj = new URL(url);
      var hostname = urlObj.hostname;
      var pathname = urlObj.pathname;
      var hash = urlObj.hash;
      var fullPath = pathname + hash;

      // 查找匹配的站点
      var site = siteConfigs.find(function (site) {
        return (
          hostname === site.url ||
          hostname.endsWith("." + site.url) ||
          hostname.includes(site.url)
        );
      });

      if (!site) return null;

      var route = findMatchingRoute(site, fullPath, pathname, hash);
      
      if (route && route.handler) {
        logMatchInfo(route);
      }

      return route ? route.handler : null;
    } catch (error) {
      console.error("查找URL处理函数时发生错误:", error);
      return null;
    }
  }

  // 将站点管理器导出到全局命名空间
  window.SiteManager = {
    findHandlerForUrl: findHandlerForUrl,
    siteConfigs: siteConfigs,
  };

  /**
   * 查找与URL匹配的路由
   * @private
   * @param {Object} site - 站点配置
   * @param {string} fullPath - 完整路径
   * @param {string} pathname - 路径名
   * @param {string} hash - 哈希部分
   * @returns {Object|null} 匹配的路由对象
   */
  function findMatchingRoute(site, fullPath, pathname, hash) {
    return site.routes.find(function(route) {
      var urlParts = parseUrlParts(fullPath);
      
      if (matchAllPages(route.path)) {
        return true;
      }

      if (route.matchType === "exact") {
        return matchExact(route.path, fullPath);
      }

      if (route.matchType === "pathExact") {
        return matchPathExact(route.path, urlParts);
      }

      if (route.matchType === "regex") {
        return matchRegex(route.path, fullPath);
      }

      return matchPathPrefix(route.path, urlParts);
    });
  }
  
  /**
   * 分离URL的各个部分
   * @private
   * @param {string} url - URL字符串
   * @returns {Object} 包含路径、查询参数和哈希的对象
   */
  function parseUrlParts(url) {
    var pathParts = url.split("?");
    var path = pathParts[0];

    var queryAndHash = pathParts.length > 1 ? pathParts[1] : "";
    var hashParts = queryAndHash.split("#");

    var query = hashParts[0];
    var hash = hashParts.length > 1 ? "#" + hashParts[1] : "";

    if (pathParts.length === 1 && url.includes("#")) {
      var fullHashParts = url.split("#");
      path = fullHashParts[0];
      hash = "#" + fullHashParts.slice(1).join("#");
      query = "";
    }

    return {
      path: path,
      query: query,
      hash: hash,
      fullPath: path + (query ? "?" + query : "") + hash,
    };
  }

  /**
   * 全部页面匹配（根路径匹配）
   * @private
   * @param {string} routePath - 路由路径
   * @returns {boolean} 是否匹配
   */
  function matchAllPages(routePath) {
    return routePath === "/";
  }

  /**
   * 精确匹配（路径、参数、hash都必须完全一致）
   * @private
   * @param {string} routePath - 路由路径
   * @param {string} urlFullPath - 完整URL路径
   * @returns {boolean} 是否匹配
   */
  function matchExact(routePath, urlFullPath) {
    return routePath === urlFullPath;
  }

  /**
   * 路径精确匹配（只匹配路径部分，忽略参数和hash）
   * @private
   * @param {string} routePath - 路由路径
   * @param {Object} urlParts - URL解析后的各部分
   * @returns {boolean} 是否匹配
   */
  function matchPathExact(routePath, urlParts) {
    var normalizedRoutePath = routePath.endsWith("/")
      ? routePath.slice(0, -1)
      : routePath;
    var normalizedUrlPath = urlParts.path.endsWith("/")
      ? urlParts.path.slice(0, -1)
      : urlParts.path;

    return normalizedRoutePath === normalizedUrlPath;
  }

  /**
   * 部分路径匹配（匹配以此开头的所有路径）
   * @private
   * @param {string} routePath - 路由路径
   * @param {Object} urlParts - URL解析后的各部分
   * @returns {boolean} 是否匹配
   */
  function matchPathPrefix(routePath, urlParts) {
    var routeParts = routePath.split("/").filter(Boolean);
    var urlPathParts = urlParts.path.split("/").filter(Boolean);

    if (urlPathParts.length < routeParts.length) return false;

    for (var i = 0; i < routeParts.length; i++) {
      if (routeParts[i] !== urlPathParts[i]) return false;
    }

    return true;
  }

  /**
   * 正则表达式匹配
   * @private
   * @param {string} routePath - 路由路径（包含正则表达式）
   * @param {string} urlFullPath - 完整URL路径
   * @returns {boolean} 是否匹配
   */
  function matchRegex(routePath, urlFullPath) {
    try {
      var regexStr = routePath.substring(1, routePath.length - 1);
      var regex = new RegExp(regexStr);
      return regex.test(urlFullPath);
    } catch (e) {
      console.error("解析路由正则表达式时出错:", e);
      return false;
    }
  }
  
  /**
   * 记录匹配信息
   * @private
   * @param {Object} route - 匹配的路由
   */
  function logMatchInfo(route) {
    var matchTypeInfo = route.path === "/" ? "全部页面匹配" 
                      : route.matchType === "exact" ? "精确匹配"
                      : route.matchType === "pathExact" ? "路径精确匹配"
                      : route.matchType === "regex" ? "正则表达式匹配"
                      : "部分路径匹配";
    
    console.log("找到处理函数: " + route.path + " (" + matchTypeInfo + ")");
  }

  /**
   * 检查所有依赖模块是否已加载
   * @private
   * @returns {Promise} 返回一个Promise，解析为依赖加载状态
   */
  function checkDependencies() {
    var requiredDependencies = [
      { name: "StorageManager", global: window.StorageManager },
      { name: "UrlMonitor", global: window.UrlMonitor },
      { name: "Utils", global: window.Utils },
      { name: "handleAndfleet", global: window.handleAndfleet },
      { name: "UI.CenterModal", global: window.UI && window.UI.CenterModal },
      { name: "UI.ExcelTable", global: window.UI && window.UI.ExcelTable },
      { name: "UI.ExpandButton", global: window.UI && window.UI.ExpandButton },
    ];

    var missingDependencies = requiredDependencies.filter(function (dep) {
      return !dep.global;
    });

    if (missingDependencies.length === 0) {
      console.log("所有依赖模块已加载完成");
      return Promise.resolve(true);
    }

    console.log(
      "等待依赖模块加载: " +
        missingDependencies
          .map(function (dep) {
            return dep.name;
          })
          .join(", ")
    );
    
    return Promise.resolve(false);
  }

  /**
   * 创建一个等待所有依赖加载的Promise
   * @private
   * @param {number} timeout - 超时时间(毫秒)
   * @returns {Promise} 返回一个Promise，解析为依赖是否成功加载
   */
  function waitForDependencies(timeout) {
    var checkPromise = new Promise(function (resolve, reject) {
      function check() {
        checkDependencies()
          .then(function (loaded) {
            if (loaded) {
              resolve(true);
            } else {
              setTimeout(check, 100);
            }
          })
          .catch(reject);
      }
      check();
    });

    var timeoutPromise = new Promise(function (resolve) {
      setTimeout(function () {
        console.error("依赖加载超时，某些模块可能未正确加载");
        resolve(false);
      }, timeout);
    });

    return Promise.race([checkPromise, timeoutPromise]);
  }

  // 初始化模块
  checkDependencies().then(function (loaded) {
    if (loaded) {
      console.log("初始化网站管理器");
    } else {
      waitForDependencies(10000)
        .then(function () {
          console.log("初始化网站管理器(延迟加载)");
        })
        .catch(function (error) {
          console.error("依赖加载过程中出错:", error);
          console.log("尝试初始化网站管理器(依赖可能不完整)");
        });
    }
  });
})();
