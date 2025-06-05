/**
 * @fileoverview 扩展后台服务，监听浏览器事件并与内容脚本通信
 */

(function() {
  /**
   * 安装/更新扩展时的处理
   */
  chrome.runtime.onInstalled.addListener(function() {
    console.log("扩展已安装/更新");
});

  /**
   * 向标签页发送URL变化通知
   * @param {number} tabId - 标签页ID
   * @param {string} url - 当前URL
   */
  function notifyTabUrlChanged(tabId, url) {
    console.log("发送URL变化通知: " + tabId);
    
    try {
      chrome.tabs.sendMessage(
        tabId, 
        {
      action: 'urlChanged',
          url: url
        },
        function() {
          // 忽略连接错误，通常是内容脚本尚未加载
        if (chrome.runtime.lastError) {
            // 静默处理错误
          }
        }
      );
    } catch (error) {
      // 静默处理错误
    }
  }

  /**
   * 监听标签页更新事件
   */
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      notifyTabUrlChanged(tabId, tab.url);
    }
  });
})();