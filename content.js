/**
 * @fileoverview 内容脚本模块，作为Chrome扩展注入到目标网页中
 * 处理URL变化并执行相应的网站处理逻辑，负责调用网站管理器查找匹配的处理函数
 */

(function() {
  /**
   * 全局配置参数
   */
  var CONFIG = {
    // URL处理防抖延迟(毫秒)
    URL_PROCESS_DELAY: 2000,
    // 重复URL处理防抖间隔(毫秒)
    URL_REPEAT_THRESHOLD: 2000
  };
  
/**
 * 内容脚本的状态对象
 * @type {Object}
 * @property {string} lastProcessedUrl - 最近一次处理的URL
 * @property {number} lastProcessTime - 最近一次处理的时间戳
 * @property {boolean} contentScriptLoaded - 内容脚本是否已加载
 * @property {number|null} urlChangeTimer - 用于延迟处理的定时器ID
 * @property {string|null} pendingUrl - 等待处理的URL
 */
  var state = {
  lastProcessedUrl: '',
  lastProcessTime: 0,
  contentScriptLoaded: false, // 初始状态为未加载
  urlChangeTimer: null, // 用于延迟处理的定时器
  pendingUrl: null // 等待处理的URL
};

/**
 * 实际处理URL变化的函数
 * @param {string} url - 要处理的URL
 */
function processUrlChange(url) {
    console.log("处理URL: " + url);
    
    var now = Date.now();
  
  // 防止重复处理同一URL
    if (url === state.lastProcessedUrl && 
        (now - state.lastProcessTime) < CONFIG.URL_REPEAT_THRESHOLD) {
    return;
  }
  
  state.lastProcessedUrl = url;
  state.lastProcessTime = now;
  
  try {
    if (window.SiteManager && typeof window.SiteManager.findHandlerForUrl === 'function') {
        var handler = window.SiteManager.findHandlerForUrl(url);
      if (handler) {
          // 创建包含页面详细信息的对象
          var pageInfo = {
            url: url,
            title: document.title || '',
            referrer: document.referrer || '',
            hostname: window.location.hostname || '',
            pathname: window.location.pathname || '',
            hash: window.location.hash || '',
            search: window.location.search || '',
            userAgent: navigator.userAgent || '',
            language: navigator.language || '',
            platform: navigator.platform || '',
            windowWidth: window.innerWidth || 0,
            windowHeight: window.innerHeight || 0,
            screenWidth: window.screen.width || 0,
            screenHeight: window.screen.height || 0,
            timestamp: now,
            documentReady: document.readyState
          };
          
          // 调用处理函数并传入页面信息对象
          handler(pageInfo);
        }
    }
  } catch (error) {
      console.error("处理URL变化时发生错误:", error);
  }
}

/**
 * URL变化的处理函数，带延迟机制
 * @param {string} url - 变化后的URL
 */
function handleUrlChange(url) {
  // 清除之前的定时器
  if (state.urlChangeTimer) {
    clearTimeout(state.urlChangeTimer);
    state.urlChangeTimer = null;
  }
  
  // 记录待处理的URL
  state.pendingUrl = url;
  
    // 设置新的定时器，延迟后处理URL变化
    state.urlChangeTimer = setTimeout(function() {
    processUrlChange(state.pendingUrl);
    state.urlChangeTimer = null;
    }, CONFIG.URL_PROCESS_DELAY);
}

/**
 * 初始化内容脚本，设置消息监听和URL监控
 */
function initContentScript() {
    console.log("初始化内容脚本");
    
  // 设置消息监听器
  try {
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'urlChanged') {
        try {
          handleUrlChange(request.url);
          sendResponse({status: 'received'});
        } catch (error) {
          sendResponse({status: 'error', message: error.message});
        }
      }
      return true; // 保持消息通道开放，以便异步发送响应
    });

    // 如果UrlMonitor可用，初始化它
      if (window.UrlMonitor && typeof window.UrlMonitor.initUrlMonitor === 'function') {
        window.UrlMonitor.initUrlMonitor(handleUrlChange, false);
    }
  
    state.contentScriptLoaded = true;
  } catch (error) {
      console.error("初始化内容脚本时发生错误:", error);
  }
}

  // 确保在DOM完全加载后再初始化
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', function() {
    try {
      initContentScript();
    } catch (error) {
        console.error("DOMContentLoaded事件中初始化内容脚本时发生错误:", error);
    }
  });
} else {
  // DOM已经加载完成，直接初始化
  try {
    initContentScript();
  } catch (error) {
      console.error("直接初始化内容脚本时发生错误:", error);
  }
}
})();