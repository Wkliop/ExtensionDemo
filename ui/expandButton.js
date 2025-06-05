/**
 * @fileoverview 提供可定位的展开按钮功能
 * @namespace UI.expandButton
 */

(function() {
  //==============================================================
  // CSS 部分 - 处理所有样式定义
  //==============================================================
  const CSS = {
    styleContent: `
      .ui-expand-button {
        position: fixed;
        width: 40px;
        height: 40px;
        border-radius: 5px;
        background-color: #3498db;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 8px;
        box-sizing: border-box;
        transition: background-color 0.3s ease;
      }
      .ui-expand-button.expanded {
        background-color: #e74c3c;
      }
      .ui-expand-button-line {
        width: 100%;
        height: 3px;
        background-color: #fff;
        border-radius: 2px;
        transition: transform 0.3s ease, opacity 0.3s ease;
        margin-bottom: 4px;
      }
      .ui-expand-button-line:last-child {
        margin-bottom: 0;
      }
      .ui-expand-button.expanded .ui-expand-button-line:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      .ui-expand-button.expanded .ui-expand-button-line:nth-child(2) {
        opacity: 0;
      }
      .ui-expand-button.expanded .ui-expand-button-line:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
      .ui-expand-button-top-right {
        top: 20px;
        right: 20px;
      }
      .ui-expand-button-top-left {
        top: 20px;
        left: 20px;
      }
      .ui-expand-button-bottom-right {
        bottom: 20px;
        right: 20px;
      }
      .ui-expand-button-bottom-left {
        bottom: 20px;
        left: 20px;
      }
      .ui-expand-button.hidden {
        display: none;
      }
    `,
    
    init() {
      if (document.getElementById('ui-expand-button-styles')) return;
      
      const styleElement = document.createElement('style');
      styleElement.id = 'ui-expand-button-styles';
      styleElement.textContent = this.styleContent;
      document.head.appendChild(styleElement);
    }
  };
  
  //==============================================================
  // HTML 部分 - 处理 DOM 元素创建
  //==============================================================
  const HTML = {
    createButton(position) {
      const element = document.createElement('div');
      element.className = `ui-expand-button ui-expand-button-${position}`;
      
      // 添加线条
      for (let i = 0; i < 3; i++) {
        element.appendChild(this.createLine());
      }
      
      return element;
    },
    
    createLine() {
      const line = document.createElement('div');
      line.className = 'ui-expand-button-line';
      return line;
    }
  };
  
  //==============================================================
  // JS 部分 - 处理行为和对外接口
  //==============================================================
  
  class ExpandButton {
    constructor(options = {}) {
      // 确保样式已初始化
      CSS.init();
      
      // 解析选项
      this.options = {
        position: options.position || 'bottomRight',
        distance: options.distance || '20px',
        size: options.size || '40px'
      };
      
      // 创建DOM元素（不插入到DOM中）
      this.element = HTML.createButton(this.options.position);
      
      // 配置按钮样式
      this._applyStyles();
      
      // 初始化状态
      this.isExpanded = false;
      this.isVisible = true;
    }
    
    _applyStyles() {
      const { size, distance, position } = this.options;
      
      // 应用尺寸
      if (size !== '40px') {
        this.element.style.width = size;
        this.element.style.height = size;
      }
      
      // 应用自定义距离
      if (distance !== '20px') {
        const positionMap = {
          topRight: ['top', 'right'],
          topLeft: ['top', 'left'],
          bottomRight: ['bottom', 'right'],
          bottomLeft: ['bottom', 'left']
        };
        
        positionMap[position].forEach(prop => {
          this.element.style[prop] = distance;
        });
      }
    }
    
    //----------------------------------------------------------
    // 对外公开方法 - 提供完整的按钮控制API
    //----------------------------------------------------------
    
    expand() {
      this.element.classList.add('expanded');
      this.isExpanded = true;
      return this;
    }
    
    collapse() {
      this.element.classList.remove('expanded');
      this.isExpanded = false;
      return this;
    }
    
    toggle() {
      return this.isExpanded ? this.collapse() : this.expand();
    }
    
    hide() {
      this.element.classList.add('hidden');
      this.isVisible = false;
      return this;
    }
    
    show() {
      this.element.classList.remove('hidden');
      this.isVisible = true;
      return this;
    }
    
    setPosition(position, distance) {
      // 更新选项
      this.options.position = position;
      if (distance) this.options.distance = distance;
      
      // 移除所有位置类
      this.element.classList.remove(
        'ui-expand-button-topRight',
        'ui-expand-button-topLeft',
        'ui-expand-button-bottomRight',
        'ui-expand-button-bottomLeft'
      );
      
      // 添加新位置类
      this.element.classList.add(`ui-expand-button-${position}`);
      
      // 清除位置样式
      this.element.style.top = '';
      this.element.style.right = '';
      this.element.style.bottom = '';
      this.element.style.left = '';
      
      // 应用自定义距离
      if (distance) {
        const positionMap = {
          topRight: ['top', 'right'],
          topLeft: ['top', 'left'],
          bottomRight: ['bottom', 'right'],
          bottomLeft: ['bottom', 'left']
        };
        
        positionMap[position].forEach(prop => {
          this.element.style[prop] = distance;
        });
      }
      
      return this;
    }
    
    setSize(size) {
      this.options.size = size;
      this.element.style.width = size;
      this.element.style.height = size;
      return this;
    }
    
    onClick(callback) {
      this.element.addEventListener('click', callback);
      return this;
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
   * 创建一个可定位的展开按钮
   * @param {Object} options 按钮配置选项
   * @param {string} [options.position='bottomRight'] 按钮位置，可选值为'topRight'、'topLeft'、'bottomRight'、'bottomLeft'
   * @param {string} [options.distance='20px'] 按钮到边缘的距离
   * @param {string} [options.size='40px'] 按钮的尺寸
   * @returns {ExpandButton} 返回按钮实例
   */
  function createExpandButton(options = {}) {
    return new ExpandButton(options);
  }
  
  // 初始化全局UI命名空间
  window.UI = window.UI || {};
  
  // 暴露到全局
  window.UI.ExpandButton = ExpandButton;
  window.UI.createExpandButton = createExpandButton;
  
  //==============================================================
  // 对外方法文档 
  //==============================================================
  /**
   * ExpandButton 类提供以下对外方法：
   * 
   * 创建按钮:
   * - new window.UI.ExpandButton(options) - 创建按钮实例
   *   - options.position: 按钮位置，可选值为'topRight'、'topLeft'、'bottomRight'、'bottomLeft'，默认为'bottomRight'
   *   - options.distance: 按钮到边缘的距离，如'20px'，默认为'20px'
   *   - options.size: 按钮的尺寸，如'40px'，默认为'40px'
   * - window.UI.createExpandButton(options) - 快速创建按钮
   *   - options: 同上
   * 
   * 状态控制:
   * - expand() - 展开按钮（变为X形）
   * - collapse() - 收起按钮（变为三条横线）
   * - toggle() - 切换展开/收起状态
   * - hide() - 隐藏按钮
   * - show() - 显示按钮
   * 
   * 样式设置:
   * - setPosition(position, distance) - 设置按钮位置和距离
   *   - position: 按钮位置，可选值为'topRight'、'topLeft'、'bottomRight'、'bottomLeft'
   *   - distance: 可选，按钮到边缘的距离，如'20px'
   * - setSize(size) - 设置按钮尺寸
   *   - size: 按钮的尺寸，如'40px'
   * 
   * 事件处理:
   * - onClick(callback) - 添加点击事件监听器
   *   - callback: 点击事件触发时执行的回调函数，接收事件对象作为参数
   * 
   * DOM操作:
   * - appendTo(parent) - 将按钮添加到指定父元素
   *   - parent: 可选，要添加按钮的父元素，默认为document.body
   * - remove() - 从DOM中移除按钮
   * 
   * 所有方法均支持链式调用: button.expand().appendTo().onClick(...)
   */
})();