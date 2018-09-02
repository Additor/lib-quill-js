import Block from '../blots/block';
import Container from '../blots/container';
import _ from 'lodash';

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

class OriginTableCell extends Block {
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

  static create(value) {
    const node = super.create();

    if (_.isString(value)) {
      node.setAttribute('data-row', value);
    } else {
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

      if (value.width) {
        node.style.width = value.width;
        node.style.minWidth = value.width;
      }
    }
    return node;
  }

  static formats(domNode) {
    return CELL_STYLE_ATTRIBUTES.reduce((formats, name) => {
      if (name === 'data-row') {
        formats[name] = domNode.getAttribute('data-row');
      } else if (name === 'data-table') {
        formats[name] = domNode.getAttribute('data-table');
      } else if (domNode.style[name]) {
        formats[name] = domNode.style[name];
      }
      return formats;
    }, {});
  }

  cellOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  format(name, value) {
    if (NOT_AVAILABLE_FORMATS.indexOf(name) !== -1) {
      return;
    }
    if (name === 'data-row') {
      this.domNode.setAttribute('data-row', value);
    } else if (name === 'data-table') {
      this.domNode.setAttribute('data-table', value);
    } else if (name === 'width') {
      this.domNode.style[name] = value;
    } else {
      super.format(name, value);
    }
  }

  getId() {
    return this.domNode.getAttribute('data-row');
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
OriginTableCell.blotName = 'table';
OriginTableCell.tagName = 'TD';

class TableCellContent extends Block {
  constructor(scroll, domNode) {
    super(scroll, domNode);

    _.defer(() => {
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

  // optimize(...args) {
  //   super.optimize(...args);
  //   this.children.forEach(child => {
  //     if (child.next == null) return;
  //     const childFormats = child.getId();
  //     const nextFormats = child.next.getId();
  //     if (childFormats !== nextFormats) {
  //       const next = this.splitAfter(child);
  //       if (next) {
  //         next.optimize();
  //       }
  //       // We might be able to merge with prev now
  //       if (this.prev) {
  //         this.prev.optimize();
  //       }
  //     }
  //   });
  // }

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
      const thisHead = this.children.head.children.head.getRowId();
      const thisTail = this.children.tail.children.tail.getRowId();
      const nextHead = this.next.children.head.children.head.getRowId();
      const nextTail = this.next.children.tail.children.tail.getRowId();
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
          value = TableCellContent.formats(row.children.head.children.head.domNode);
        }
        const cell = this.scroll.create(TableCell.blotName);
        const cellContent = this.scroll.create(TableCellContent.blotName, value);
        cell.appendChild(cellContent);
        row.appendChild(cell);
        cellContent.optimize(); // Add break blot
      });
    });
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
      const value = TableCellContent.formats(
        row.children.head.children.head.domNode,
      );
      value['data-cell'] = cellId();
      const cell = this.scroll.create(TableCellContent.blotName, value);
      row.insertBefore(cell, ref);
    });
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
