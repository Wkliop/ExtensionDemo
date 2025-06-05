/**
 * @fileoverview 实用工具函数集合，用于简化页面操作和DOM交互
 * @namespace Utils
 */

(function() {
  /**
   * 等待DOM结构稳定后执行回调函数
   * @param {number} [waitTime=3000] - 等待DOM稳定的时间(毫秒),默认3000ms
   * @param {number} [timeout=30000] - 超时时间(毫秒)，如果在此时间内DOM未稳定则拒绝Promise,默认30000ms 
   * @param {Object} [options] - 配置选项
   * @param {Node} [options.target=document.body] - 要观察的目标节点
   * @param {boolean} [options.subtree=true] - 是否观察后代节点变化
   * @param {boolean} [options.childList=true] - 是否观察子节点变化
   * @param {boolean} [options.attributes=true] - 是否观察属性变化
   * @param {boolean} [options.characterData=true] - 是否观察节点内容变化
   * @param {boolean} [options.checkUrlChange=true] - 是否在URL变化时取消等待
   * @returns {Promise<void>} 当DOM稳定时resolved的Promise，超时或URL变化时rejected
   */
  function waitForDOMStable(waitTime = 3000, timeout = 30000, options = {
    target: document.body,
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    checkUrlChange: true
  }) {
    console.log("开始等待页面稳定");
    return new Promise(function(resolve, reject) {
      // 解构配置选项
      var target = options.target;
      var subtree = options.subtree;
      var childList = options.childList;
      var attributes = options.attributes;
      var characterData = options.characterData;
      var checkUrlChange = options.checkUrlChange;
      
      // 检查目标节点
      if (!target) {
        return reject(new Error('目标节点不存在'));
      }
      
      // 标记状态变量
      var done = false;
      var initialUrl = checkUrlChange ? window.location.href : null;
      var lastMutationTime = Date.now();
      
      // 稳定计时器和超时计时器
      var stabTimer = null;
      var timeoutTimer = null;
      
      // 创建清理函数
      function cleanup() {
        if (observer) {
          observer.disconnect();
        }
        if (stabTimer) {
          clearTimeout(stabTimer);
        }
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }
      }
      
      // 设置稳定计时器函数
      function setStabilityTimer() {
        stabTimer = setTimeout(function() {
          // 检查是否已处理完成
          if (done) {
            return;
          }
          
          // 检查URL是否变化
          if (checkUrlChange && window.location.href !== initialUrl) {
            done = true;
            cleanup();
            reject(new Error('页面URL已变化，取消DOM稳定等待'));
            return;
          }
          
          // 达到稳定状态
          done = true;
          cleanup();
          resolve();
        }, waitTime);
      }
      
      // 创建MutationObserver
      var observer = new MutationObserver(function() {
        lastMutationTime = Date.now();
        
        // 重置稳定计时器
        if (stabTimer) {
          clearTimeout(stabTimer);
        }
        
        // 如果未完成，重新设置稳定计时器
        if (!done) {
          setStabilityTimer();
        }
      });
      
      // 设置超时计时器
      timeoutTimer = setTimeout(function() {
        if (done) {
          return;
        }
        done = true;
        cleanup();
        reject(new Error('等待DOM稳定超时(' + timeout + 'ms)'));
      }, timeout);
      
      // 开始观察DOM变化
      observer.observe(target, {
        subtree: subtree,
        childList: childList,
        attributes: attributes,
        characterData: characterData
      });
      
      // 初始化稳定计时器
      setStabilityTimer();
    });
  }

  /**
   * 等待特定元素出现在DOM中
   * @param {string} selector - 要等待的元素的CSS选择器
   * @param {number} [timeout=10000] - 等待超时时间(毫秒),默认10000ms
   * @param {Object} [options] - 配置选项
   * @param {boolean} [options.checkUrlChange=true] - 是否在URL变化时取消等待
   * @param {Node} [options.root=document] - 要观察的根节点
   * @returns {Promise<Element>} 返回找到的元素
   */
  function waitForElement(selector, timeout = 10000, options = {
    checkUrlChange: true,
    root: document
  }) {
    console.log("开始等待元素出现");
    return new Promise(function(resolve, reject) {
      // 解构配置选项
      var checkUrlChange = options.checkUrlChange;
      var root = options.root || document;
      
      // 初始URL
      var initialUrl = checkUrlChange ? window.location.href : null;
      var done = false;
      
      // 检查元素是否已存在
      var element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }
      
      // 定时器
      var timeoutTimer = null;
      
      // 创建清理函数
      function cleanup() {
        if (observer) {
          observer.disconnect();
        }
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }
      }
      
      // 创建MutationObserver
      var observer = new MutationObserver(function() {
        // 检查URL是否变化
        if (initialUrl !== null && window.location.href !== initialUrl) {
          if (done) return;
          done = true;
          cleanup();
          reject(new Error('页面URL已变化，取消等待元素'));
          return;
        }
        
        // 检查元素是否已出现
        var element = document.querySelector(selector);
        if (element) {
          if (done) return;
          done = true;
          cleanup();
          resolve(element);
        }
      });
      
      // 设置超时计时器
      timeoutTimer = setTimeout(function() {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error('等待元素(' + selector + ')超时(' + timeout + 'ms)'));
      }, timeout);
      
      // 开始观察DOM变化
      observer.observe(root, {
        childList: true,
        subtree: true
      });
    });
  }

  /**
   * 创建元素状态监视器
   * @param {string} selector - 要监控的元素的CSS选择器
   * @param {Object} [options] - 配置选项
   * @param {number} [options.checkInterval=300] - 检查元素的间隔时间(毫秒)
   * @param {boolean} [options.useMutationObserver=true] - 是否使用MutationObserver来提高性能
   * @param {number} [options.stableTime=100] - 元素需要稳定存在的时间(毫秒)，默认为0表示立即触发
   * @param {Node} [options.root=document] - 要观察的根节点
   * @returns {Object} 返回监听器对象，包含onAppear、onDisappear和stop方法
   */
  function createElementMonitor(selector, options = {
    checkInterval: 300,
    useMutationObserver: true,
    stableTime: 100,
    root: document
  }) {
    console.log("开始创建元素监视器");
    // 解构配置选项
    var checkInterval = options.checkInterval || 300;
    var useMutationObserver = options.useMutationObserver !== false;
    var stableTime = options.stableTime || 100;
    var root = options.root || document;
    
    // 状态变量
    var isElementPresent = false;
    var isCallbackTriggered = false;
    var appearanceTime = 0;
    
    // 资源变量
    var intervalId = null;
    var observer = null;
    var stableTimerId = null;
    
    // 回调函数存储
    var appearCallbacks = [];
    var disappearCallbacks = [];
    var notFoundCallbacks = [];
    
    // 检查元素函数
    function checkElement() {
      var element = document.querySelector(selector);
      var elementExists = !!element;
      var currentTime = Date.now();
      
      // 如果元素状态发生变化
      if (elementExists !== isElementPresent) {
        isElementPresent = elementExists;
        
        if (isElementPresent) {
          // 元素出现
          appearanceTime = currentTime;
          
          // 如果需要等待稳定时间
          if (stableTime > 0) {
            // 清除之前的计时器
            if (stableTimerId) {
              clearTimeout(stableTimerId);
            }
            
            // 设置新的稳定计时器
            isCallbackTriggered = false;
            stableTimerId = setTimeout(function() {
              // 再次检查元素是否仍然存在
              var stableElement = document.querySelector(selector);
              if (stableElement && !isCallbackTriggered) {
                isCallbackTriggered = true;
                // 触发所有出现回调
                appearCallbacks.forEach(function(callback) {
                  try {
                    callback(stableElement);
                  } catch (err) {
                    // 忽略回调错误
                  }
                });
              }
            }, stableTime);
          } else {
            // 不需要稳定时间，立即触发
            isCallbackTriggered = true;
            // 触发所有出现回调
            appearCallbacks.forEach(function(callback) {
              try {
                callback(element);
              } catch (err) {
                // 忽略回调错误
              }
            });
          }
        } else {
          // 元素消失
          // 清除稳定计时器
          if (stableTimerId) {
            clearTimeout(stableTimerId);
            stableTimerId = null;
          }
          
          // 重置触发状态
          isCallbackTriggered = false;
          
          // 触发所有消失回调
          disappearCallbacks.forEach(function(callback) {
            try {
              callback();
            } catch (err) {
              // 忽略回调错误
            }
          });
        }
      } else if (isElementPresent && !isCallbackTriggered && stableTime > 0) {
        // 元素持续存在的情况，检查是否已经达到稳定时间
        if (currentTime - appearanceTime >= stableTime) {
          isCallbackTriggered = true;
          var stableElement = document.querySelector(selector);
          if (stableElement) {
            // 触发所有出现回调
            appearCallbacks.forEach(function(callback) {
              try {
                callback(stableElement);
              } catch (err) {
                // 忽略回调错误
              }
            });
          }
        }
      } else if (!isElementPresent) {
        // 元素未找到，触发notFound回调
        notFoundCallbacks.forEach(function(callback) {
          try {
            callback();
          } catch (err) {
            // 忽略回调错误
          }
        });
      }
    }
    
    // 初始化监控
    function startMonitoring() {
      // 首次检查
      checkElement();
      
      // 使用MutationObserver提高性能
      if (useMutationObserver && window.MutationObserver) {
        observer = new MutationObserver(function() {
          checkElement();
        });
        
        // 观察DOM变化
        observer.observe(root, {
          childList: true,
          subtree: true
        });
      }
      
      // 使用间隔计时器作为备份
      intervalId = setInterval(checkElement, checkInterval);
    }
    
    // 停止监控函数
    function stopMonitoring() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      
      if (stableTimerId) {
        clearTimeout(stableTimerId);
        stableTimerId = null;
      }
      
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      
      // 清空回调列表
      appearCallbacks = [];
      disappearCallbacks = [];
      notFoundCallbacks = [];
      
      return monitor; // 支持链式调用
    }
    
    // 创建监视器对象
    var monitor = {
      // 添加元素出现时的回调
      onAppear: function(callback) {
        if (typeof callback === 'function') {
          appearCallbacks.push(callback);
          
          // 如果元素已存在且已稳定，立即触发
          if (isElementPresent && isCallbackTriggered) {
            var element = document.querySelector(selector);
            if (element) {
              try {
                callback(element);
              } catch (err) {
                // 忽略回调错误
              }
            }
          }
        }
        return monitor; // 支持链式调用
      },
      
      // 添加元素消失时的回调
      onDisappear: function(callback) {
        if (typeof callback === 'function') {
          disappearCallbacks.push(callback);
        }
        return monitor; // 支持链式调用
      },
      
      // 添加元素未找到时的回调
      onNotFound: function(callback) {
        if (typeof callback === 'function') {
          notFoundCallbacks.push(callback);
          
          // 如果元素当前不存在，立即触发
          if (!isElementPresent) {
            try {
              callback();
            } catch (err) {
              // 忽略回调错误
            }
          }
        }
        return monitor; // 支持链式调用
      },
      
      // 停止监控
      stop: stopMonitoring
    };
    
    // 启动监控
    startMonitoring();
    
    // 返回监视器对象
    return monitor;
  }

  /**
   * 确保回调函数只执行一次，生成随机标识符并监控URL变化
   * @returns {Promise} 返回Promise对象，resolve时会传入当前URL
   */
  function ensureOnce() {
    console.log("函数执行一次");
    return new Promise(function(resolve) {
      // 生成随机标识符
      var randId = 'once_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      var currentUrl = window.location.href;
      
      // 输出标识符信息
      console.log('[ensureOnce] 生成标识符:', randId);
      console.log('[ensureOnce] 当前URL:', currentUrl);
      
      // 创建标记元素
      var marker = document.createElement('div');
      marker.setAttribute('data-once-id', randId);
      
      // 设置为隐藏元素
      Object.assign(marker.style, {
        position: 'absolute',
        width: '0',
        height: '0',
        overflow: 'hidden',
        opacity: '0',
        pointerEvents: 'none'
      });
      
      // 添加到文档中
      document.body.appendChild(marker);
      
      // 监控URL变化
      var lastUrl = currentUrl;
      var urlCheckInterval = setInterval(function() {
        var newUrl = window.location.href;
        if (newUrl !== lastUrl) {
          console.log('[ensureOnce] URL已变化:', newUrl);
          lastUrl = newUrl;
        }
        
        // 检查标识符是否仍然存在
        var markerExists = document.querySelector('[data-once-id="' + randId + '"]') !== null;
        console.log('[ensureOnce] 标识符', randId, markerExists ? '仍然存在' : '已不存在');
        
        // 如果标识符不存在，清除定时器
        if (!markerExists) {
          clearInterval(urlCheckInterval);
        }
      }, 1000);
      
      // 提供清理函数
      marker.cleanup = function() {
        clearInterval(urlCheckInterval);
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker);
        }
      };
      
      // 立即解析Promise
      resolve(currentUrl);
    });
  }

  // 将工具函数导出到全局命名空间
  window.Utils = {
    waitForDOMStable: waitForDOMStable,
    waitForElement: waitForElement,
    createElementMonitor: createElementMonitor,
    ensureOnce: ensureOnce
  };
})();
