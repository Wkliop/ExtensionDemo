/**
 * @fileoverview 网站管理模块，负责集中管理所有支持的网站配置及处理逻辑
 */

(function () {
  /**
   * 站点配置数组，定义支持的网站和对应的路由规则
   */
  var siteConfigs = [
    {
      url: "andfleet.cm-iov.com",
      routes: [
        {
          path: "/v1/evhe/#/order/",
          handler: handleAndfleet,
        },
      ],
    },
  ];

  /**
   * 检查所有依赖模块是否已加载
   * @returns {boolean} 是否所有依赖都已加载
   */
  function checkDependencies() {
    // 所有必须的依赖模块列表
    var requiredDependencies = [
      { name: "StorageManager", global: window.StorageManager },
      { name: "UrlMonitor", global: window.UrlMonitor },
      { name: "Utils", global: window.Utils },
      { name: "handleAndfleet", global: window.handleAndfleet },
      { name: "UI.CenterModal", global: window.UI && window.UI.CenterModal },
      { name: "UI.ExcelTable", global: window.UI && window.UI.ExcelTable },
      { name: "UI.ExpandButton", global: window.UI && window.UI.ExpandButton },
    ];

    // 检查每个依赖是否存在
    var missingDependencies = requiredDependencies.filter(function (dep) {
      return !dep.global;
    });

    if (missingDependencies.length > 0) {
      console.log(
        "等待依赖模块加载: " +
          missingDependencies
            .map(function (dep) {
              return dep.name;
            })
            .join(", ")
      );
      return false;
    }

    console.log("所有依赖模块已加载完成");
    return true;
  }

  /**
   * 网站管理器初始化函数，包含主要功能逻辑
   */
  function initSiteManager() {
    console.log("初始化网站管理器");

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

        // 查找匹配的路由
        var route = site.routes.find(function (route) {
          // 如果路径为根路径"/"，则匹配所有
          if (route.path === "/") return true;

          // 精确匹配完整路径
          if (fullPath === route.path) return true;

          // 精确匹配路径名
          if (pathname === route.path) return true;

          // 检查路由是否包含hash部分
          var routeHasHash = route.path.includes("#");

          // 前缀匹配 - 确保路径以"/"结尾，表示匹配该路径下的所有子路径
          if (route.path.endsWith("/") && !route.path.includes("*")) {
            // 如果路由包含hash，使用fullPath进行前缀匹配
            if (routeHasHash) {
              return fullPath.startsWith(route.path);
            }
            // 否则使用pathname进行前缀匹配
            return pathname.startsWith(route.path);
          }

          // 精确路径部分匹配 - 检查是否匹配路径的精确部分
          if (!route.path.endsWith("/") && !route.path.includes("*")) {
            // 如果路由包含hash，需要特殊处理
            if (routeHasHash) {
              // 将路由路径分割为pathname和hash部分
              var routePathParts = route.path.split("#");
              var routePathname = routePathParts[0];
              var routeHash = routePathParts[1];

              // 检查pathname是否匹配
              if (!pathname.startsWith(routePathname)) return false;

              // 检查hash是否匹配（前缀匹配）
              if (hash && routeHash && !hash.startsWith("#" + routeHash))
                return false;

              return true;
            }

            // 将路径分割成段
            var routeParts = route.path.split("/").filter(function (part) {
              return part.length > 0;
            });
            var pathParts = pathname.split("/").filter(function (part) {
              return part.length > 0;
            });

            // 如果路由路径段多于实际路径段，不可能匹配
            if (routeParts.length > pathParts.length) return false;

            // 检查每一段是否匹配
            for (var i = 0; i < routeParts.length; i++) {
              if (routeParts[i] !== pathParts[i]) return false;
            }

            return true;
          }

          // 通配符匹配
          if (route.path.includes("*")) {
            return fullPath.startsWith(route.path.replace("*", ""));
          }

          // 正则表达式匹配
          if (route.path.startsWith("/^") && route.path.endsWith("$/")) {
            try {
              var regexStr = route.path.substring(1, route.path.length - 1);
              var regex = new RegExp(regexStr);
              return regex.test(fullPath);
            } catch (e) {
              // 静默处理错误
              return false;
            }
          }

          return false;
        });

        if (route && route.handler) {
          console.log("找到处理函数: " + route.path);
        }

        return route ? route.handler : null;
      } catch (error) {
        // 静默处理错误
        return null;
      }
    }

    // 将站点管理器导出到全局命名空间
    window.SiteManager = {
      findHandlerForUrl: findHandlerForUrl,
      siteConfigs: siteConfigs,
    };
  }

  // 依赖检查和初始化
  if (checkDependencies()) {
    // 如果所有依赖都已加载，直接初始化
    initSiteManager();
  } else {
    // 如果有依赖未加载，设置轮询检查
    var checkInterval = setInterval(function () {
      if (checkDependencies()) {
        clearInterval(checkInterval);
        initSiteManager();
      }
    }, 100); // 每100毫秒检查一次

    // 设置超时，避免无限等待
    setTimeout(function () {
      if (checkInterval) {
        clearInterval(checkInterval);
        console.error("依赖加载超时，某些模块可能未正确加载");
        // 尝试初始化，即使某些依赖可能缺失
        initSiteManager();
      }
    }, 10000); // 10秒超时
  }
})();
