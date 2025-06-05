/**
 * @fileoverview 存储管理模块，提供站点特定存储和跨域共享存储功能
 * @namespace StorageManager
 */

(function() {
  /**
   * 存储状态和缓存管理
   */
  var storageMap = new Map();
  var dbConnection = null;
  var DB_NAME = 'officeAssistantDB';
  var DB_VERSION = 1;
  var STORE_NAME = 'siteData';
  
  /**
   * 检查存储可用性
   * @returns {Object} 可用的存储API
   */
  function checkStorageAvailability() {
    return {
      indexedDB: typeof window.indexedDB !== 'undefined',
      chromeStorage: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,
      localStorage: typeof localStorage !== 'undefined'
    };
  }

  /**
   * 初始化IndexedDB数据库
   * @returns {Promise<boolean>} 是否成功初始化
   */
  function initDatabase() {
    console.log("初始化数据库");
    return new Promise(function(resolve) {
      if (!window.indexedDB) {
        resolve(false);
        return;
      }

      var request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = function() {
        resolve(false);
      };
      
      request.onsuccess = function(event) {
        dbConnection = event.target.result;
        resolve(true);
      };
      
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'siteName' });
        }
      };
    });
  }

  // 初始化数据库
  var dbPromise = initDatabase();

  /**
   * 保存数据到存储
   * @param {string} siteName - 站点名称
   * @param {Object} data - 要保存的数据
   */
  function saveData(siteName, data) {
    // 1. 尝试保存到IndexedDB
    dbPromise.then(function(isDbReady) {
      if (isDbReady && dbConnection) {
        try {
          var transaction = dbConnection.transaction([STORE_NAME], 'readwrite');
          var store = transaction.objectStore(STORE_NAME);
           
          // 如果数据为空对象，则删除该记录
          if (data && Object.keys(data).length === 0) {
            store.delete(siteName);
          } else {
            store.put({
              siteName: siteName,
              data: data,
              lastUpdated: Date.now()
            });
          }
        } catch (error) {
          saveToFallback(siteName, data);
        }
      } else {
        saveToFallback(siteName, data);
      }
    });
  }

  /**
   * 彻底删除站点数据
   * @param {string} siteName - 站点名称
   */
  function deleteData(siteName) {
    console.log("删除数据: " + siteName);
    // 从IndexedDB删除
    dbPromise.then(function(isDbReady) {
      if (isDbReady && dbConnection) {
        try {
          var transaction = dbConnection.transaction([STORE_NAME], 'readwrite');
          var store = transaction.objectStore(STORE_NAME);
          store.delete(siteName);
        } catch (error) {
          // 静默处理错误
        }
      }
    });
    
    // 从其他存储删除
    var storageKey = `site_${siteName}`;
    var availability = checkStorageAvailability();
    
    if (availability.chromeStorage) {
      chrome.storage.local.remove(storageKey);
    }
    
    if (availability.localStorage) {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        // 静默处理错误
      }
    }
  }

  /**
   * 保存到备用存储
   * @param {string} siteName - 站点名称
   * @param {Object} data - 要保存的数据
   */
  function saveToFallback(siteName, data) {
    var storageKey = `site_${siteName}`;
    var availability = checkStorageAvailability();
    
    // 如果数据为空对象，则删除该记录
    if (data && Object.keys(data).length === 0) {
      if (availability.chromeStorage) {
        chrome.storage.local.remove(storageKey);
      }
      if (availability.localStorage) {
        try {
          localStorage.removeItem(storageKey);
        } catch (err) {
          // 静默处理错误
        }
      }
      return;
    }
    
    // 否则保存数据
    if (availability.chromeStorage) {
      var obj = {};
      obj[storageKey] = data;
      chrome.storage.local.set(obj);
    } else if (availability.localStorage) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (err) {
        // 静默处理错误
      }
    }
  }

  /**
   * 从存储加载数据
   * @param {string} siteName - 站点名称
   * @returns {Promise<Object>} 加载的数据
   */
  function loadData(siteName) {
    return new Promise(function(resolve) {
      dbPromise.then(function(isDbReady) {
        if (isDbReady && dbConnection) {
          try {
            var transaction = dbConnection.transaction([STORE_NAME], 'readonly');
            var store = transaction.objectStore(STORE_NAME);
            var request = store.get(siteName);
            
            request.onsuccess = function(event) {
              if (event.target.result) {
                resolve(event.target.result.data || {});
              } else {
                loadFromFallback(siteName).then(resolve);
              }
            };
            
            request.onerror = function() {
              loadFromFallback(siteName).then(resolve);
            };
          } catch (error) {
            loadFromFallback(siteName).then(resolve);
          }
        } else {
          loadFromFallback(siteName).then(resolve);
        }
      });
    });
  }

  /**
   * 从备用存储加载数据
   * @param {string} siteName - 站点名称
   * @returns {Promise<Object>} 加载的数据
   */
  function loadFromFallback(siteName) {
    return new Promise(function(resolve) {
      var storageKey = `site_${siteName}`;
      var availability = checkStorageAvailability();
      
      if (availability.chromeStorage) {
        chrome.storage.local.get(storageKey, function(result) {
          resolve(result[storageKey] || {});
        });
      } else if (availability.localStorage) {
        try {
          var data = localStorage.getItem(storageKey);
          resolve(data ? JSON.parse(data) : {});
        } catch (err) {
          resolve({});
        }
      } else {
        resolve({});
      }
    });
  }

  /**
   * 获取指定站点的存储对象
   * @param {string} siteName - 站点名称
   * @returns {Promise<Object>} 存储代理对象
   */
  function getStorage(siteName) {
    console.log("获取存储: " + siteName);
    
    // 已存在则直接返回
    if (storageMap.has(siteName)) {
      return Promise.resolve(storageMap.get(siteName));
    }
    
    // 内存缓存
    var memoryCache = {};
    var hasDeletedProps = false;
    
    // 创建代理对象
    var handler = {
      get: function(target, prop) {
        return memoryCache[prop];
      },
      
      set: function(target, prop, value) {
        if (value === null || value === undefined) {
          // 标记删除属性并保存
          delete memoryCache[prop];
          hasDeletedProps = true;
          saveData(siteName, memoryCache);
          return true;
        } else {
          memoryCache[prop] = value;
          
          // 自动保存
          saveData(siteName, memoryCache);
          return true;
        }
      },
      
      deleteProperty: function(target, prop) {
        if (prop in memoryCache) {
          delete memoryCache[prop];
          hasDeletedProps = true;
          
          // 如果删除后对象为空，则彻底删除存储项
          if (Object.keys(memoryCache).length === 0) {
            deleteData(siteName);
          } else {
            saveData(siteName, memoryCache);
          }
          return true;
        }
        return false;
      }
    };
    
    var proxy = new Proxy({}, handler);
    storageMap.set(siteName, proxy);
    
    // 加载数据并返回
    return loadData(siteName).then(function(data) {
      Object.assign(memoryCache, data);
      return proxy;
    });
  }

  /**
   * 获取共享存储对象
   * @param {string} namespace - 命名空间，必须提供
   * @returns {Promise<Object>} 共享存储对象
   * @throws {Error} 如果未提供命名空间则抛出错误
   */
  function getSharedStorage(namespace) {
    if (!namespace) {
      throw new Error("必须提供命名空间参数");
    }
    
    // 使用特殊前缀处理共享存储
    var storageId = 'shared_' + namespace;
    
    // 转给普通存储处理，但使用特殊标识
    return getStorage(storageId);
  }

  // 导出API
  window.StorageManager = {
    getStorage: getStorage,
    getSharedStorage: getSharedStorage
  };
})();