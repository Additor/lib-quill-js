import Block from '../blots/block';
import Container from '../blots/container';
import _ from 'lodash';
import Emitter from '../core/emitter';
import Quill from '../core/quill';

const CELL_STYLE_ATTRIBUTES = ['data-cell', 'data-row', 'data-table', 'data-width', 'width'];
const NOT_AVAILABLE_FORMATS = [
  'background',
  'script',
  'blockquote',
  'header',
  'indent',
  'list',
  'align',
  'direction',
  'code-block',
  'embed',
  'image',
];

class TableCellContent extends Block {
  constructor(scroll, domNode) {
    super(scroll, domNode);

    setTimeout(() => {
      const cellWidth = this.domNode.getAttribute('data-width');
      if (cellWidth) {
        this.parent.domNode.style.width = cellWidth;
        this.parent.domNode.style.minWidth = cellWidth;
      }
    });
  }

  static create(value) {
    const node = super.create();

    if (value['data-cell']) {
      node.setAttribute('data-cell', value['data-cell']);
    } else {
      node.setAttribute('data-cell', cellId());
    }

    if (value['data-row']) {
      node.setAttribute('data-row', value['data-row']);
    } else {
      node.setAttribute('data-row', rowId());
    }

    if (value['data-table']) {
      node.setAttribute('data-table', value['data-table']);
    } else {
      node.setAttribute('data-table', tableId());
    }

    if (value['data-width']) {
      node.setAttribute('data-width', value['data-width']);
    }

    return node;
  }

  static formats(domNode) {
    return CELL_STYLE_ATTRIBUTES.reduce((formats, name) => {
      if (name === 'data-cell') {
        formats[name] = domNode.getAttribute('data-cell');
      } else if (name === 'data-row') {
        formats[name] = domNode.getAttribute('data-row');
      } else if (name === 'data-table') {
        formats[name] = domNode.getAttribute('data-table');
      } else if (name === 'data-width') {
        formats[name] = domNode.getAttribute('data-width');
      } else if (domNode.style[name]) {
        formats[name] = domNode.style[name];
      }
      return formats;
    }, {});
  }

  format(name, value) {
    if (NOT_AVAILABLE_FORMATS.indexOf(name) !== -1) {
      return;
    }
    if (name === 'data-row') {
      this.domNode.setAttribute('data-row', value);
    } else if (name === 'data-table') {
      this.domNode.setAttribute('data-table', value);
    } else if (name === 'data-width') {
      this.domNode.setAttribute('data-width', value);
    } else if (name === 'width') {
      this.domNode.style[name] = value;
    } else {
      super.format(name, value);
    }
  }

  cellOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  getId() {
    return this.domNode.getAttribute('data-cell');
  }

  getRowId() {
    return this.domNode.getAttribute('data-row');
  }

  row() {
    return this.parent.parent;
  }

  rowOffset() {
    if (this.row()) {
      return this.row().rowOffset();
    }
    return -1;
  }

  table() {
    return this.row() && this.row().table();
  }

  tableWrapper() {
    return this.table().wrapper();
  }
}
TableCellContent.blotName = 'table';
TableCellContent.tagName = 'div';
TableCellContent.className = 'td-content';

/* new cell */
class TableCell extends Container {
  constructor(scroll, domNode) {
    super(scroll, domNode);

    if (scroll.isEnabled()) {
      const resizer = document.createElement('div');
      const resizerInner = document.createElement('div');
      resizerInner.classList.add('resizer-inner');
      resizer.appendChild(resizerInner);
      resizer.classList.add('resizer');
      resizer.contentEditable = false;
      domNode.appendChild(resizer);
      resizer.addEventListener('mouseenter', () => {
        if (!scroll.isEnabled()) return;
        resizer.classList.add('hovered');
        const tableContainer = this.table();
        const cells = tableContainer.cells(this.cellOffset());
        _.forEach(cells, cell => cell.resizer.classList.add('hovered'));
      });
      resizer.addEventListener('mouseleave', () => {
        if (!scroll.isEnabled()) return;
        resizer.classList.remove('hovered');
        const tableContainer = this.table();
        const cells = tableContainer.cells(this.cellOffset());
        _.forEach(cells, cell => cell.resizer.classList.remove('hovered'));
      });

      this.resizer = resizer;
    }
  }

  checkMerge() {
    if (super.checkMerge() && this.next.children.head != null) {
      const thisHead = this.children.head.getId();
      const thisTail = this.children.tail.getId();
      const nextHead = this.next.children.head.getId();
      const nextTail = this.next.children.tail.getId();
      return (
        thisHead === thisTail && thisHead === nextHead && thisHead === nextTail
      );
    }
    return false;
  }

  optimize(...args) {
    super.optimize(...args);
    this.children.forEach(child => {
      if (child.next == null) return;
      const childFormats = child.getId();
      const nextFormats = child.next.getId();
      if (childFormats !== nextFormats) {
        const next = this.splitAfter(child);
        if (next) {
          next.optimize();
        }
        // We might be able to merge with prev now
        if (this.prev) {
          this.prev.optimize();
        }
      }
    });
  }

  cellOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  getId() {
    return this.children.head.domNode.getAttribute('data-row');
  }

  row() {
    return this.parent;
  }

  rowOffset() {
    if (this.row()) {
      return this.row().rowOffset();
    }
    return -1;
  }

  table() {
    return this.row() && this.row().table();
  }
}
TableCell.blotName = 'table-cell';
TableCell.tagName = 'TD';

class TableRow extends Container {
  checkMerge() {
    if (super.checkMerge() && this.next.children.head != null) {
      const thisHead = _.invoke(this.children, 'head.children.head.getRowId', '');
      const thisTail = _.invoke(this.children, 'tail.children.tail.getRowId', '');
      const nextHead = _.invoke(this.next.children.head, 'children.head.getRowId', '');
      const nextTail = _.invoke(this.next.children.tail, 'children.tail.getRowId', '');
      return (
        thisHead === thisTail &&
        thisHead === nextHead &&
        thisHead === nextTail
      );
    }
    return false;
  }

  optimize(...args) {
    super.optimize(...args);
    this.children.forEach(child => {
      if (child.next == null) return;
      const childFormats = child.getId();
      const nextFormats = child.next.getId();
      if (childFormats !== nextFormats) {
        const next = this.splitAfter(child);
        if (next) {
          next.optimize();
        }
        // We might be able to merge with prev now
        if (this.prev) {
          this.prev.optimize();
        }
      }
    });
  }

  rowOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  table() {
    return this.parent && this.parent.parent;
  }
}
TableRow.blotName = 'table-row';
TableRow.tagName = 'TR';

class TableBody extends Container {}
TableBody.blotName = 'table-body';
TableBody.tagName = 'TBODY';

class TableContainer extends Container {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    _.defer(() => {
      const rows = this.rows();
      if (!_.isEmpty(rows)) {
        let resized = false;
        rows[0].children.forEach((child) => {
          if (child.domNode.style.width) resized = true;
        });
        if (!resized) {
          this.domNode.style.tableLayout = 'fixed';
          this.domNode.style.width = 'calc(100% - 5px)';
        }
      }
    });
  }

  balanceCells() {
    const rows = this.descendants(TableRow);
    const maxColumns = rows.reduce((max, row) => {
      return Math.max(row.children.length, max);
    }, 0);
    rows.forEach(row => {
      new Array(maxColumns - row.children.length).fill(0).forEach(() => {
        let value;
        if (row.children.head != null) {
          value = TableCellContent.formats(
            row.children.head.children.head.domNode,
          );
        }
        value['data-cell'] = cellId();
        const cell = this.scroll.create(TableCell.blotName);
        const cellContent = this.scroll.create(
          TableCellContent.blotName,
          value,
        );
        cell.appendChild(cellContent);
        cell.optimize(); // Add break blot
        cellContent.optimize(); // Add break blot
        row.appendChild(cell);
      });
    });
  }

  fitCells(force = false) {
    const rows = this.rows();
    if (!rows[0]) return;
    const headCells = rows[0].children.map(child => child);

    // resize 된 셀이 없으면 테이블의 가로길이가 항상 100% 이기에 따로 조정해주지 않는다.
    const resized = _.some(headCells, cell => cell.children.head.domNode.hasAttribute('data-width'));
    if (!resized) return;

    // 테이블의 width가 MIN_TABLE_WIDTH 보다 작을 때 테이블의 가로길이를 100%로 지정한다.
    if (this.domNode.offsetWidth > Quill.DEFAULTS.minTableWidth && !force) return;

    const tableOffsetWidth = this.domNode.offsetWidth;
    const rootWidth = this.scroll.domNode.offsetWidth - 5;
    this.domNode.style.width = `${rootWidth}px`;
    if (rows[0].children.head.domNode.style.width) {
      rows[0].children.forEach(child => {
        const originWidth = Number.parseInt(child.domNode.style.width.replace('px', ''));
        const newWidth = (originWidth / tableOffsetWidth) * rootWidth;
        const newWidthString = `${newWidth}px`;
        child.domNode.style.width = newWidthString;
        child.domNode.style.minWidth = newWidthString;

        const headCellContent = child.children.head;
        if (headCellContent) {
          // headCellContent.format('data-width', newWidthString);
        }
      });
    }
  }

  cells(column) {
    return this.rows().map(row => row.children.at(column));
  }

  deleteColumn(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach(row => {
      const cell = row.children.at(index);
      if (cell != null) {
        cell.remove();
      }
    });
  }

  insertColumn(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach(row => {
      const ref = row.children.at(index);
      const targetCell = ref ? ref.prev || ref : row.children.tail;
      const value = TableCellContent.formats(targetCell.children.head.domNode);
      value['data-cell'] = cellId();
      const cell = this.scroll.create(TableCellContent.blotName, value);
      row.insertBefore(cell, ref);
    });
    if (this.domNode.offsetWidth <= Quill.DEFAULTS.minTableWidth) {
      setTimeout(() => this.fitCells(true));
    }
  }

  insertRow(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    const rid = rowId();
    const tid = body.children.head.children.head.children.head.domNode.getAttribute('data-table');
    const row = this.scroll.create(TableRow.blotName);
    body.children.head.children.forEach(() => {
      const cell = this.scroll.create(TableCell.blotName);
      const cellContent = this.scroll.create(TableCellContent.blotName, {
        'data-cell': cellId(),
        'data-row': rid,
        'data-table': tid,
      });
      cellContent.optimize(); // add break
      cell.appendChild(cellContent);
      row.appendChild(cell);
    });
    const ref = body.children.at(index);
    body.insertBefore(row, ref);
  }

  rows() {
    const body = this.children.head;
    if (body == null) return [];
    return body.children.map(row => row);
  }

  wrapper() {
    return this.parent.parent;
  }
}
TableContainer.blotName = 'table-container';
TableContainer.tagName = 'TABLE';

class ScrollableTableContainer extends Container {}

ScrollableTableContainer.blotName = 'scrollable-table-container';
ScrollableTableContainer.className = 'scrollable-table-container';
ScrollableTableContainer.tagName = 'DIV';

class TableWrapper extends Container {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    domNode.id = tableId();

    const leftTableCursorHelper = document.createElement('div');
    const rightTableCursorHelper = document.createElement('div');

    leftTableCursorHelper.className = 'table-cursor-helper left';
    rightTableCursorHelper.className = 'table-cursor-helper right';
    leftTableCursorHelper.setAttribute('contenteditable', false);
    rightTableCursorHelper.setAttribute('contenteditable', false);

    domNode.appendChild(leftTableCursorHelper);
    domNode.appendChild(rightTableCursorHelper);

    leftTableCursorHelper.addEventListener('click', () => this.showFakeCursor(true));
    rightTableCursorHelper.addEventListener('click', () => this.showFakeCursor(false));
  }

  showFakeCursor(left = true) {
    let cursorParent;
    if (left) {
      cursorParent = this.domNode.querySelector('.table-cursor-helper.left');
    } else {
      cursorParent = this.domNode.querySelector('.table-cursor-helper.right');
    }
    if (!cursorParent) return;
    const oldFakeCursor = document.getElementById('table-fake-cursor');
    if (oldFakeCursor) oldFakeCursor.remove();
    this.scroll.domNode.blur();
    const fakeCursor = document.createElement('div');
    fakeCursor.id = 'table-fake-cursor';
    fakeCursor.className = 'table-fake-cursor';
    cursorParent.appendChild(fakeCursor);
    setTimeout(() => {
      // fakeCursor 가 생성된 이후 이벤트부터 받고 보내기 위해 setTimeout 을 건다.
      this.scroll.emitter.once(Emitter.events.SELECTION_CHANGE, () => {
        fakeCursor.remove();
      });
      this.scroll.emitter.emit(Emitter.events.TABLE_FOCUS, {
        blot: this,
        cursorOffset: left ? 0 : 1,
      });
    });
  }

  checkMerge() {
    if (super.checkMerge()) {
      if (this.statics.blotName === this.next.statics.blotName) {
        const thisTableId = this.getNearestDataTable(this.children);
        const nextTableId = this.getNearestDataTable(this.next.children);
        return !!thisTableId && !!nextTableId && thisTableId === nextTableId;
      }
      return true;
    }
    return false;
  }

  getNearestDataTable(children) {
    if (!children.head || !children.head.children) return null;
    if (children.head.domNode.hasAttribute('data-table')) {
      return children.head.domNode.getAttribute('data-table');
    }
    return this.getNearestDataTable(children.head.children);
  }

  table() {
    return this.descendant(TableContainer);
  }
}
TableWrapper.blotName = 'table-wrapper';
TableWrapper.className = 'table-wrapper';
TableWrapper.tagName = 'DIV';

TableWrapper.allowedChildren = [ScrollableTableContainer];
ScrollableTableContainer.requiredContainer = TableWrapper;

ScrollableTableContainer.allowedChildren = [TableContainer];
TableContainer.requiredContainer = ScrollableTableContainer;

TableContainer.allowedChildren = [TableBody];
TableBody.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;

TableCell.allowedChildren = [TableCellContent];
TableCellContent.requiredContainer = TableCell;

function cellId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `cell-${id}`;
}

function rowId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `row-${id}`;
}

function tableId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `table-${id}`;
}

export { TableCellContent, TableCell, TableRow, TableBody, TableContainer, ScrollableTableContainer, TableWrapper, cellId, rowId, tableId };
