/**
 * @fileoverview 提供类似Excel的表格功能，支持数据驱动的表格展示
 * 当数据对象发生变化时，表格UI会自动更新
 * @namespace UI.excelTable
 */

(function() {
  //==============================================================
  // CSS 部分 - 处理所有样式定义
  //==============================================================
  const CSS = {
    styleContent: `
      .ui-excel-table-container {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
        color: #ffffff;
      }
      .ui-excel-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #ffffff;
        table-layout: fixed;
        background-color: #121212;
      }
      .ui-excel-table-header-row {
        background-color: #333333;
      }
      .ui-excel-table-header-cell {
        padding: 8px;
        border: 1px solid #ffffff;
        text-align: center;
        font-weight: bold;
        white-space: normal;
        word-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #ffffff;
      }
      .ui-excel-table-data-cell {
        padding: 6px;
        border: 1px solid #ffffff;
        text-align: left;
        white-space: normal;
        word-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #ffffff;
        position: relative;
        min-height: 40px;
      }
      .ui-excel-table-clickable-cell {
        cursor: pointer;
        color: #4a9eff;
        text-decoration: underline;
      }
      .ui-excel-table-row-even {
        background-color: #121212;
      }
      .ui-excel-table-row-odd {
        background-color: #1e1e1e;
      }
      .ui-excel-table-tooltip {
        position: absolute;
        background-color: #000000;
        color: #ffffff;
        padding: 5px 10px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.8);
        z-index: 10001;
        max-width: 300px;
        word-wrap: break-word;
        pointer-events: none;
        font-size: 14px;
        border: 1px solid #555555;
        display: none;
      }
    `,
    
    init() {
      if (!document.getElementById('ui-excel-table-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'ui-excel-table-styles';
        styleElement.textContent = this.styleContent;
        document.head.appendChild(styleElement);
      }
    }
  };
  
  //==============================================================
  // HTML 部分 - 处理 DOM 元素创建
  //==============================================================
  const HTML = {
    createContainer() {
      const container = document.createElement('div');
      container.className = 'ui-excel-table-container';
      return container;
    },
    
    createTable() {
      const table = document.createElement('table');
      table.className = 'ui-excel-table';
      return table;
    },
    
    createThead() {
      return document.createElement('thead');
    },
    
    createTbody() {
      return document.createElement('tbody');
    },
    
    createHeaderRow() {
      const headerRow = document.createElement('tr');
      headerRow.className = 'ui-excel-table-header-row';
      return headerRow;
    },
    
    createHeaderCell(text) {
      const th = document.createElement('th');
      th.className = 'ui-excel-table-header-cell';
      th.textContent = text;
      th.title = text;
      return th;
    },
    
    createDataRow(rowIndex) {
      const tr = document.createElement('tr');
      tr.dataset.rowIndex = rowIndex;
      if (rowIndex % 2 === 0) {
        tr.className = 'ui-excel-table-row-even';
      } else {
        tr.className = 'ui-excel-table-row-odd';
      }
      return tr;
    },
    
    createDataCell(text, rowIndex, colIndex) {
      const td = document.createElement('td');
      td.className = 'ui-excel-table-data-cell';
      td.textContent = text || '';
      td.dataset.rowIndex = rowIndex;
      td.dataset.colIndex = colIndex;
      td.title = td.textContent;
      return td;
    },
    
    createTooltip() {
      const tooltip = document.createElement('div');
      tooltip.id = 'ui-excel-table-tooltip';
      tooltip.className = 'ui-excel-table-tooltip';
      return tooltip;
    }
  };
  
  //==============================================================
  // JS 部分 - 处理行为和对外接口
  //==============================================================
  
  class ExcelTable {
    /**
     * 创建一个数据驱动的Excel表格
     * @param {Object} options 表格配置选项
     * @param {string[]} [options.headers=[]] 表头列标题
     * @param {Array<Array<string>>} [options.data=[]] 表格数据
     * @param {Object} [options.style={}] 表格容器样式
     */
    constructor(options = {}) {
      // 确保样式已初始化
      CSS.init();
      
      // 解析选项
      this.options = {
        headers: options.headers || [],
        data: options.data || [],
        style: options.style || {}
      };
      
      // 创建DOM元素
      this._createTableElements();
      
      // 渲染表格
      this._renderTable();
      
      // 事件处理器
      this._clickHandler = null;
    }
    
    _createTableElements() {
      this.container = HTML.createContainer();
      
      // 应用自定义样式
      if (this.options.style) {
        Object.keys(this.options.style).forEach(key => {
          this.container.style[key] = this.options.style[key];
        });
      }
      
      this.table = HTML.createTable();
      this.thead = HTML.createThead();
      this.headerRow = HTML.createHeaderRow();
      this.tbody = HTML.createTbody();
      
      this.thead.appendChild(this.headerRow);
      this.table.appendChild(this.thead);
      this.table.appendChild(this.tbody);
      this.container.appendChild(this.table);
    }
    
    _renderHeaders() {
      this.headerRow.innerHTML = '';
      const { headers } = this.options;
      
      headers.forEach(header => {
        const th = HTML.createHeaderCell(header);
        this.headerRow.appendChild(th);
      });
    }
    
    _renderData() {
      this.tbody.innerHTML = '';
      const { data, headers } = this.options;
      
      data.forEach((rowData, rowIndex) => {
        const tr = HTML.createDataRow(rowIndex);
        
        // 创建每一列
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
          const cellValue = rowData[colIndex] !== undefined ? rowData[colIndex] : '';
          const td = HTML.createDataCell(cellValue, rowIndex, colIndex);
          this._attachTooltipEvents(td);
          tr.appendChild(td);
        }
        
        this.tbody.appendChild(tr);
      });
    }
    
    _renderTable() {
      this._renderHeaders();
      this._renderData();
    }
    
    _attachTooltipEvents(element) {
      element.addEventListener('mouseenter', this._showTooltip);
      element.addEventListener('mouseleave', this._hideTooltip);
    }
    
    _showTooltip(e) {
      if (this.scrollWidth <= this.clientWidth) return;
      
      let tooltip = document.getElementById('ui-excel-table-tooltip');
      if (!tooltip) {
        tooltip = HTML.createTooltip();
        document.body.appendChild(tooltip);
      }
      
      tooltip.textContent = this.textContent;
      
      const rect = this.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      
      tooltip.style.top = (rect.top + scrollTop - tooltip.offsetHeight - 5) + 'px';
      tooltip.style.left = (rect.left + scrollLeft) + 'px';
      tooltip.style.display = 'block';
    }
    
    _hideTooltip() {
      const tooltip = document.getElementById('ui-excel-table-tooltip');
      if (tooltip) {
        tooltip.style.display = 'none';
      }
    }
    
    _updateRowStripes() {
      for (let i = 0; i < this.tbody.children.length; i++) {
        const row = this.tbody.children[i];
        if (i % 2 === 0) {
          row.className = 'ui-excel-table-row-even';
        } else {
          row.className = 'ui-excel-table-row-odd';
        }
        row.dataset.rowIndex = i;
        
        // 更新每个单元格的行索引
        for (let j = 0; j < row.children.length; j++) {
          row.children[j].dataset.rowIndex = i;
        }
      }
    }
    
    //----------------------------------------------------------
    // 对外公开方法 - 提供完整的数据驱动API
    //----------------------------------------------------------
    
    /**
     * 设置表格数据并更新UI
     * @param {Object} tableData 表格数据对象
     * @param {string[]} tableData.headers 表头数组
     * @param {Array<Array<string>>} tableData.data 数据二维数组
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    setData(tableData) {
      if (!tableData) return this;
      
      if (Array.isArray(tableData.headers)) {
        this.options.headers = tableData.headers;
      }
      
      if (Array.isArray(tableData.data)) {
        this.options.data = tableData.data;
      }
      
      this._renderTable();
      return this;
    }
    
    /**
     * 获取当前表格的所有数据
     * @returns {Object} 包含headers和data的表格数据对象
     */
    getData() {
      return {
        headers: [...this.options.headers],
        data: this.options.data.map(row => [...row])
      };
    }
    
    /**
     * 添加一行数据
     * @param {Array<string>} rowData 行数据数组
     * @param {number} [position] 插入位置，默认添加到末尾
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    addRow(rowData, position) {
      if (!Array.isArray(rowData)) return this;
      
      if (position !== undefined && position >= 0 && position <= this.options.data.length) {
        this.options.data.splice(position, 0, rowData);
      } else {
        this.options.data.push(rowData);
      }
      
      this._renderData();
      return this;
    }
    
    /**
     * 删除指定行
     * @param {number} rowIndex 要删除的行索引
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    removeRow(rowIndex) {
      if (rowIndex >= 0 && rowIndex < this.options.data.length) {
        this.options.data.splice(rowIndex, 1);
        this._renderData();
      }
      return this;
    }
    
    /**
     * 更新单元格值
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @param {string} value 新值
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    updateCell(rowIndex, colIndex, value) {
      if (
        rowIndex >= 0 && 
        rowIndex < this.options.data.length && 
        colIndex >= 0 && 
        colIndex < this.options.headers.length
      ) {
        this.options.data[rowIndex][colIndex] = value;
        
        // 更新DOM
        const row = this.tbody.children[rowIndex];
        if (row) {
          const cell = row.children[colIndex];
          if (cell) {
            cell.textContent = value;
            cell.title = value;
          }
        }
      }
      return this;
    }
    
    /**
     * 获取单元格值
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @returns {string|null} 单元格值，如果不存在则返回null
     */
    getCellValue(rowIndex, colIndex) {
      if (
        rowIndex >= 0 && 
        rowIndex < this.options.data.length && 
        colIndex >= 0 && 
        colIndex < this.options.headers.length
      ) {
        return this.options.data[rowIndex][colIndex];
      }
      return null;
    }
    
    /**
     * 设置单元格点击事件处理器
     * @param {Function} handler 点击事件处理函数，接收参数(event, rowIndex, colIndex, cellValue, rowData)
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    onCellClick(handler) {
      // 移除旧的处理器
      if (this._clickHandler) {
        this.tbody.removeEventListener('click', this._clickHandler);
      }
      
      // 添加新的处理器
      if (typeof handler === 'function') {
        this._clickHandler = (e) => {
          const cell = e.target.closest('td');
          if (!cell) return;
          
          const rowIndex = parseInt(cell.dataset.rowIndex, 10);
          const colIndex = parseInt(cell.dataset.colIndex, 10);
          
          if (
            rowIndex >= 0 && 
            rowIndex < this.options.data.length && 
            colIndex >= 0 && 
            colIndex < this.options.headers.length
          ) {
            const cellValue = this.options.data[rowIndex][colIndex];
            const rowData = this.options.data[rowIndex];
            handler(e, rowIndex, colIndex, cellValue, rowData);
          }
        };
        
        this.tbody.addEventListener('click', this._clickHandler);
      }
      
      return this;
    }
    
    /**
     * 清空表格数据（保留表头）
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    clear() {
      this.options.data = [];
      this._renderData();
      return this;
    }
    
    /**
     * 获取表格DOM元素
     * @returns {HTMLElement} 表格容器元素
     */
    getElement() {
      return this.container;
    }
    
    /**
     * 将表格添加到指定父元素
     * @param {HTMLElement} parent 父元素，默认为document.body
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    appendTo(parent = document.body) {
      parent.appendChild(this.container);
      return this;
    }
    
    /**
     * 从DOM中移除表格
     * @returns {ExcelTable} 表格实例，支持链式调用
     */
    remove() {
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      return this;
    }
  }
  
  /**
   * 创建一个数据驱动的Excel表格
   * @param {Object} tableData 表格数据对象
   * @param {string[]} tableData.headers 表头数组
   * @param {Array<Array<string>>} tableData.data 数据二维数组
   * @param {Object} [style={}] 表格样式
   * @returns {ExcelTable} 表格实例
   */
  function createExcelTable(tableData, style = {}) {
    return new ExcelTable({
      headers: tableData.headers || [],
      data: tableData.data || [],
      style
    });
  }
  
  // 初始化全局UI命名空间
  window.UI = window.UI || {};
  
  // 暴露到全局
  window.UI.ExcelTable = ExcelTable;
  window.UI.createExcelTable = createExcelTable;
  
  //==============================================================
  // 对外方法文档 
  //==============================================================
  /**
   * ExcelTable 类提供以下对外方法：
   * 
   * 创建表格:
   * - new window.UI.ExcelTable(options) - 创建表格实例
   *   - options.headers: 表头列标题数组，如['姓名', '年龄', '性别']，默认为[]
   *   - options.data: 表格数据二维数组，如[['张三','25','男'], ['李四','30','女']]，默认为[]
   *   - options.style: 表格容器的自定义样式对象，会应用到外层容器元素，默认为{}
   * - window.UI.createExcelTable(tableData, style) - 快速创建表格
   *   - tableData: 包含headers和data的表格数据对象
   *   - style: 表格容器样式对象，默认为{}
   * 
   * 数据操作:
   * - setData(tableData) - 设置表格数据并更新UI
   *   - tableData: 包含headers和data的表格数据对象
   * - getData() - 获取当前表格的所有数据
   *   - 返回: 包含headers和data的表格数据对象
   * - addRow(rowData, position) - 添加一行数据
   *   - rowData: 行数据数组，如['张三', '25', '男']
   *   - position: 可选，插入位置，默认添加到末尾
   * - removeRow(rowIndex) - 删除指定行
   *   - rowIndex: 要删除的行索引，从0开始
   * - updateCell(rowIndex, colIndex, value) - 更新单元格值
   *   - rowIndex: 行索引，从0开始
   *   - colIndex: 列索引，从0开始
   *   - value: 新的单元格值
   * - getCellValue(rowIndex, colIndex) - 获取单元格值
   *   - rowIndex: 行索引，从0开始
   *   - colIndex: 列索引，从0开始
   *   - 返回: 单元格值，如果不存在则返回null
   * - clear() - 清空表格数据（保留表头）
   * 
   * 事件处理:
   * - onCellClick(handler) - 设置单元格点击事件处理器
   *   - handler: 点击事件处理函数，接收参数(event, rowIndex, colIndex, cellValue, rowData)
   * 
   * DOM操作:
   * - getElement() - 获取表格DOM元素，返回表格容器元素
   * - appendTo(parent) - 将表格添加到指定父元素
   *   - parent: 可选，要添加表格的父元素，默认为document.body
   * - remove() - 从DOM中移除表格
   * 
   * 所有方法均支持链式调用: table.setData().addRow().appendTo()
   */
})();
