/**
 * @fileoverview URL监控模块，负责检测页面URL变化，包括单页应用中的变化
 */

(function() {
  /**
   * 初始化URL监控
   * @param {Function} onUrlChange - URL变化时的回调函数
   * @param {boolean} [checkImmediately=false] - 是否立即执行一次URL检查
   */
  function initUrlMonitor(onUrlChange, checkImmediately) {
    console.log("初始化URL监控");
    
    // 设置默认值
    checkImmediately = checkImmediately !== undefined ? checkImmediately : false;
    
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    // 重写history.pushState方法以捕获URL变化
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      onUrlChange(window.location.href);
    };

    // 重写history.replaceState方法以捕获URL变化
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      onUrlChange(window.location.href);
    };

    // 监听popstate事件以捕获浏览器前进/后退操作
    window.addEventListener('popstate', function() {
      onUrlChange(window.location.href);
    });
    
    // 如果需要立即检查当前URL
    if (checkImmediately) {
      onUrlChange(window.location.href);
    }
  }

  // 将URL监控功能导出到全局命名空间
  window.UrlMonitor = {
    initUrlMonitor: initUrlMonitor
  };
})();