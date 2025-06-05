/**
 * @fileoverview 提供全屏遮罩模态弹窗的功能，用于在页面中央显示内容，支持多标签页
 * @namespace UI.centerModal
 */

(function() {
  //==============================================================
  // CSS 部分 - 处理所有样式定义
  //==============================================================
  const CSS = {
    styleContent: `
      .ui-center-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        opacity: 0;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.3s ease;
        overflow: auto;
      }
      .ui-center-modal.visible {
        opacity: 1;
        display: flex;
      }
      .ui-center-modal-content {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        color: #333;
      }
      .ui-center-modal-tabbar {
        display: flex;
        background-color: #f0f0f0;
        border-bottom: 1px solid #ddd;
        padding-left: 10px;
        padding-right: 10px;
        overflow: auto;
        white-space: nowrap;
      }
      .ui-center-modal-tab {
        padding: 10px 15px;
        cursor: pointer;
        border-right: 1px solid #ddd;
        border-top: 3px solid transparent;
        background-color: #f0f0f0;
        color: #666;
        font-weight: normal;
        transition: all 0.2s ease;
      }
      .ui-center-modal-tab.active {
        border-top: 3px solid #4285f4;
        background-color: #fff;
        color: #333;
        font-weight: bold;
      }
      .ui-center-modal-container {
        flex: 1;
        overflow: hidden;
        position: relative;
        background-color: #fff;
      }
      .ui-center-modal-tab-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        background-color: #fff;
        color: #333;
      }
      .ui-center-modal-tab-content.active {
        display: block;
      }
      .ui-center-modal-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
      .ui-center-modal-inner-content {
        padding: 20px;
        height: calc(100% - 40px);
        overflow: auto;
      }
    `,
    
    init() {
      if (!document.getElementById('ui-center-modal-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'ui-center-modal-styles';
        styleElement.textContent = this.styleContent;
        document.head.appendChild(styleElement);
      }
    }
  };
  
  //==============================================================
  // HTML 部分 - 处理 DOM 元素创建
  //==============================================================
  const HTML = {
    createModal() {
      const modal = document.createElement('div');
      modal.className = 'ui-center-modal';
      return modal;
    },
    
    createModalContent(width, height) {
      const modalContent = document.createElement('div');
      modalContent.className = 'ui-center-modal-content';
      modalContent.style.width = width;
      modalContent.style.height = height;
      return modalContent;
    },
    
    createTabBar() {
      const tabBar = document.createElement('div');
      tabBar.className = 'ui-center-modal-tabbar';
      return tabBar;
    },
    
    createTab(title, index, isActive) {
      const tab = document.createElement('div');
      tab.className = 'ui-center-modal-tab';
      if (isActive) {
        tab.classList.add('active');
      }
      tab.textContent = title || `标签 ${index + 1}`;
      tab.dataset.index = index;
      return tab;
    },
    
    createContentContainer() {
      const contentContainer = document.createElement('div');
      contentContainer.className = 'ui-center-modal-container';
      return contentContainer;
    },
    
    createTabContent(isActive) {
      const content = document.createElement('div');
      content.className = 'ui-center-modal-tab-content';
      if (isActive) {
        content.classList.add('active');
      }
      return content;
    },
    
    createIframe(url) {
      const iframe = document.createElement('iframe');
      iframe.className = 'ui-center-modal-iframe';
      iframe.src = url;
      return iframe;
    },
    
    createInnerContent() {
      const innerContent = document.createElement('div');
      innerContent.className = 'ui-center-modal-inner-content';
      return innerContent;
    }
  };
  
  //==============================================================
  // JS 部分 - 处理行为和对外接口
  //==============================================================
  
  class CenterModal {
    constructor(options = {}) {
      // 确保样式已初始化
      CSS.init();
      
      // 解析选项
      this.options = {
        tabs: options.tabs || [],
        width: options.width || '80%',
        height: options.height || '60%',
        activeTab: options.activeTab || 0,
        onClose: options.onClose || null
      };
      
      // 创建DOM元素（不插入到DOM中）
      this.element = this._createModalElement();
      
      // 标签页内容数组
      this.tabContents = [];
      
      // 初始化标签页
      this._initTabs();
      
      // 设置事件
      this._setupEvents();
    }
    
    _createModalElement() {
      const modal = HTML.createModal();
      const modalContent = HTML.createModalContent(this.options.width, this.options.height);
      
      this.tabBar = HTML.createTabBar();
      this.contentContainer = HTML.createContentContainer();
      
      modalContent.appendChild(this.tabBar);
      modalContent.appendChild(this.contentContainer);
      modal.appendChild(modalContent);
      
      return modal;
    }
    
    _initTabs() {
      const { tabs, activeTab } = this.options;
      
      tabs.forEach((tabConfig, index) => {
        this._createTab(tabConfig, index, index === activeTab);
      });
    }
    
    _createTab(tabConfig, index, isActive) {
      // 创建标签
      const tab = HTML.createTab(tabConfig.title, index, isActive);
      tab.onclick = () => this._activateTab(index);
      this.tabBar.appendChild(tab);
      
      // 创建内容区域
      const content = HTML.createTabContent(isActive);
      
      // 如果有URL，创建iframe
      if (tabConfig.url) {
        const iframe = HTML.createIframe(tabConfig.url);
        content.appendChild(iframe);
      } else {
        // 如果没有URL，创建一个内容区
        const innerContent = HTML.createInnerContent();
        content.appendChild(innerContent);
      }
      
      this.contentContainer.appendChild(content);
      this.tabContents.push(content);
    }
    
    _activateTab(index) {
      // 更新标签样式
      Array.from(this.tabBar.children).forEach((tab, i) => {
        if (i === index) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // 显示/隐藏内容
      this.tabContents.forEach((content, i) => {
        if (i === index) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    }
    
    _setupEvents() {
      // 点击遮罩层关闭
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element && this.options.onClose) {
          this.options.onClose();
          this.hide();
        }
      });
    }
    
    //----------------------------------------------------------
    // 对外公开方法 - 提供完整的模态窗口控制API
    //----------------------------------------------------------
    
    show() {
      this.element.classList.add('visible');
      return this;
    }
    
    hide() {
      this.element.classList.remove('visible');
      
      // 等待过渡完成后再设置display为none
      setTimeout(() => {
        if (!this.element.classList.contains('visible')) {
          this.element.style.display = 'none';
          if (this.options.onClose) this.options.onClose();
        }
      }, 300);
      
      return this;
    }
    
    toggle() {
      if (this.element.classList.contains('visible')) {
        this.hide();
      } else {
        this.element.style.display = 'flex';
        // 强制回流以确保过渡效果生效
        void this.element.offsetWidth;
        this.show();
      }
      return this;
    }
    
    addTab(tabConfig) {
      const index = this.options.tabs.length;
      this.options.tabs.push(tabConfig);
      
      this._createTab(tabConfig, index, false);
      
      return index;
    }
    
    switchToTab(index) {
      if (index >= 0 && index < this.options.tabs.length) {
        this._activateTab(index);
      }
      return this;
    }
    
    getTabContent(index) {
      if (index >= 0 && index < this.tabContents.length) {
        const content = this.tabContents[index];
        // 返回内容区域的第一个子元素（iframe或innerContent）
        return content.firstChild;
      }
      return null;
    }
    
    getContentElement() {
      return this.element.firstChild;
    }
    
    getTabBarElement() {
      return this.tabBar;
    }
    
    appendTo(parent = document.body) {
      parent.appendChild(this.element);
      return this;
    }
    
    remove() {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      return this;
    }
  }
  
  /**
   * 创建一个居中模态窗口，支持多标签页
   * @param {Object} options - 配置选项
   * @param {Array} [options.tabs] - 标签页配置，每个标签页包含title和url属性
   * @param {string} [options.width='80%'] - 模态窗口宽度
   * @param {string} [options.height='60%'] - 模态窗口高度
   * @param {string} [options.activeTab=0] - 默认激活的标签页索引
   * @param {Function} [options.onClose] - 关闭回调函数
   * @returns {CenterModal} 返回模态窗口实例
   */
  function createCenterModal(options = {}) {
    return new CenterModal(options);
  }
  
  // 初始化全局UI命名空间
  window.UI = window.UI || {};
  
  // 暴露到全局
  window.UI.CenterModal = CenterModal;
  window.UI.createCenterModal = createCenterModal;
  
  //==============================================================
  // 对外方法文档 
  //==============================================================
  /**
   * CenterModal 类提供以下对外方法：
   * 
   * 创建模态窗口:
   * - new window.UI.CenterModal(options) - 创建模态窗口实例
   *   - options.tabs: 标签页配置数组，每个对象包含title(标题)和url(可选，链接)，默认为[]
   *   - options.width: 模态窗口宽度，如'80%'或'800px'，默认为'80%'
   *   - options.height: 模态窗口高度，如'60%'或'600px'，默认为'60%'
   *   - options.activeTab: 默认激活的标签页索引，从0开始，默认为0
   *   - options.onClose: 关闭回调函数，模态窗口关闭时触发，默认为null
   * 
   * 显示控制:
   * - show() - 显示模态窗口
   * - hide() - 隐藏模态窗口
   * - toggle() - 切换显示/隐藏状态
   * 
   * 标签页操作:
   * - addTab(tabConfig) - 添加新标签页，返回标签索引
   *   - tabConfig: 标签页配置对象，包含title(标题)和url(可选，链接)属性
   * - switchToTab(index) - 切换到指定标签页
   *   - index: 标签页索引，从0开始
   * - getTabContent(index) - 获取指定标签页的内容元素
   *   - index: 标签页索引，从0开始
   * 
   * DOM操作:
   * - appendTo(parent) - 将模态窗口添加到指定父元素
   *   - parent: 可选，要添加模态窗口的父元素，默认为document.body
   * - remove() - 从DOM中移除模态窗口
   * - getContentElement() - 获取模态窗口内容区域DOM
   * - getTabBarElement() - 获取标签栏DOM
   * 
   * 所有方法均支持链式调用: modal.show().switchToTab(1).addTab(...)
   */
})();